export class Line {
    #tinyAction = 'create'
    #setRerumId = () => {
        if (this.annotation.id && this.annotation.id.startsWith(process.env.RERUMIDPREFIX)) {
            this.id = this.annotation.id
            return this
        }
        this.annotation.id = `${process.env.RERUMIDPREFIX}${Date.now()}`
        return this
    }
    constructor(line = {}) {
        this.annotation = line
        if (!this.annotation.id) {
            this.annotation.id = Date.now().toString()
        }
    }

    constructor({ id, target, body }) {
        if (!id || !body || !target) {
            throw new Error('Line data is malformed.')
        }
        this.id = id
        this.body = body
        this.target = target
        if (id.startsWith?.(process.env.RERUMIDPREFIX)) {
            this.#tinyAction = 'update'
        }
        return this
    }

    set id(id) {
        this.annotation.id = id
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
            await databaseTiny.save(lineAsAnnotation).catch(err => {
                throw new Error(`Failed to save Page to RERUM: ${err.message}`)
            })
            this.#tinyAction = 'update'
            return this
        }

        const existingLine = await fetch(this.id).then(res => res.json())
        if (!existingLine) {
            throw new Error(`Failed to find Line in RERUM: ${this.id}`)
        }

        const updatedLine = { ...existingLine, ...lineAsAnnotation }
        const newURI = await databaseTiny.update(updatedLine)
            .then(res => res.headers.get('location'))
            .catch(err => {
                throw new Error(`Failed to update Line in RERUM: ${err.message}`)
            })

        this.id = newURI
        this.#tinyAction = 'update'
        return this
    }

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
            body: this.body
        }
    }

    async updateText(text) {
        if (typeof text !== 'string') {
            throw new Error('Text content must be a string')
        }
        if (this.body === text) {
            return this
        }
        this.body = text
        return this.update()
    }

    async updateBounds({ x, y, w, h }) {
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
        return isLD
            ? {
                '@context': 'http://iiif.io/api/presentation/3/context.json',
                id: this.id,
                type: 'Annotation',
                '@context': 'http://www.w3.org/ns/anno.jsonld',
                body: this.annotation.body ?? '',
                target: this.annotation.target ?? ''
            }
            : {}
    }

    setTextContent(text) {
        if (typeof text !== 'string') {
            throw new Error('Text content must be a string')
        }
        this.annotation.body = text
    }

    setImageLink(url) {
        if (typeof url !== 'string' || !/^https?:\/\//.test(url)) {
            throw new Error('Image link must be a valid URL')
        }
        this.annotation.target = url
    }

    create() {
        return Promise.resolve(new Line())
    }

    save() {
        return Promise.resolve()
    }

    getParentPage() {
        return Promise.resolve(new AnnotationPage())
    }

    getPreviousLine() {
        return Promise.resolve(new Line())
    }

    getNextLine() {
        return Promise.resolve(new Line())
    }

    getParentCollection() {
        return Promise.resolve(new AnnotationCollection())
    }

    getMetadata() {
        return Promise.resolve('Get only metadata of the page')
    }

    fetchMetadata() {
        return this.getMetadata()
    }

    asHTML() {
        return Promise.resolve('<html><body>This is the HTML document content.</body></html>')
    }

    delete() {
        return Promise.resolve()
    }
}
