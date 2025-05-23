import dbDriver from "../../database/driver.js"

const databaseTiny = new dbDriver("tiny")
export default class Line {

    #tinyAction = 'create'
    #setRerumId() {
        if (this.#tinyAction === 'create') {
            this.id = `${process.env.RERUMIDPREFIX}${id.split("/").pop()}`
        }
        return this
    }

    constructor({ id, target, body }) {
        if (!id || !body || !target) {
            throw new Error('Line data is malformed.')
        }
        this.id = id // Ensure the id is assigned
        this.body = body
        this.target = target
        if (id.startsWith?.(process.env.RERUMIDPREFIX)) {
            this.#tinyAction = 'update'
        }
        return this
    }

    static build(projectId, pageId, { id, body, target }) {
        id ??= `${process.env.SERVERURL}/project/${projectId}/page/${pageId}/line/${databaseTiny.reserveId()}`
        return new Line({ id, body, target })
    }

    async #saveLineToRerum() {
        const lineAsAnnotation = {
            "@context": "http://iiif.io/api/presentation/3/context.json",
            id: this.id,
            type: "Annotation",
            motivation: this.motivation ?? "transcribing",
            target: this.target,
            body: this.body
        }
        if (this.label) lineAsAnnotation.label = { "none": [this.label] }
        if (this.#tinyAction === 'create') {
            await databaseTiny.save(lineAsAnnotation)
                .catch(err => {
                    throw new Error(`Failed to save Page to RERUM: ${err.message}`)
                })
            this.#tinyAction = 'update'
            return this
        }
        // ...else Update the existing page in RERUM
        const existingLine = await fetch(this.id).then(res => res.json())
        if (!existingLine) {
            throw new Error(`Failed to find Line in RERUM: ${this.id}`)
        }
        const updatedLine = { ...existingLine, ...lineAsAnnotation }
        const newURI = await databaseTiny.update(updatedLine).then(res => res.headers.get('location')).catch(err => {
            throw new Error(`Failed to update Line in RERUM: ${err.message}`)
        })
        this.id = newURI
        this.#tinyAction = 'update'
        return this
    }
   /**
     * Check the Project for any RERUM documents and either upgrade a local version or overwrite the RERUM version.
     * @returns {Promise} Resolves to the updated Layer object as stored in Project.
     */
   async update() {
    if (this.#tinyAction === 'update' || typeof this.body !== 'string') {
        await this.#setRerumId().#saveLineToRerum()
    }
    return this.#updateLineForPage()
}
    
async #updateLineForPage() {
    return {
        id: this.id,
        target: this.target,
        body: this.body,
    }
}
    async updateText(text) {
        if (typeof text !== 'string') {
            throw new Error('Text content must be a string')
        }
        if(this.body === text) {
            return this
        }
        this.body = text
        return this.update()
    }

    async updateBounds({x, y, w, h}) {
        if (!x || !y || !w || !h) {
            throw new Error('Bounds ({x,y,w,h}) must be provided')
        }
        this.target ??= ''
        const newTarget = `${this.target.split('=')[0]}=${x},${y},${w},${h}`
        if (this.target === newTarget) {
            return this
        }
        this.target = newTarget
        return this.update()
    }

    asJSON(isLD) {
        return isLD ? {
            '@context': 'http://iiif.io/api/presentation/3/context.json',
            id: this.id,
            type: 'Annotation',
            motivation: this.motivation ?? 'transcribing',
            target: this.target,
            body: this.body,
        } : {
            id: this.id,
            body: this.body ?? '',
            target: this.target ?? '',
        }
    }

    asHTML() {
        return Promise.resolve('<html><body>This is the HTML document content.</body></html>')
    }

    async delete() {
        if (this.#tinyAction === 'update') {
            await databaseTiny.remove(this.id)
                .catch(err => false)
        }
        return true
    }
}
