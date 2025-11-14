import dbDriver from "../../database/driver.js"
import { fetchUserAgent } from "../../utilities/shared.js"

const databaseTiny = new dbDriver("tiny")
export default class Line {

    #tinyAction = 'create'
    #setRerumId() {
        if (!this.id.startsWith(process.env.RERUMIDPREFIX)) {
            this.id = `${process.env.RERUMIDPREFIX}${this.id.split("/").pop()}`
        }
        return this
    }

    constructor({ id, target, body = '', motivation = 'transcribing', label = '', type = 'Annotation', creator = null }) {
        if (!id || !target)
            throw new Error('Line data is malformed.')
        this.id = id // Ensure the id is assigned
        this.body = body
        this.target = target
        this.creator = creator
        this.motivation = motivation
        this.label = label
        this.type = type
        if (id.startsWith?.(process.env.RERUMIDPREFIX)) {
            this.#tinyAction = 'update'
        }
    }

    static build(projectId, pageId, { body, target, motivation, label, type }, creator) {
        // TODO: Should this have a space for an id that is sent in?
        const id = `${process.env.SERVERURL}project/${projectId}/page/${pageId}/line/${databaseTiny.reserveId()}`
        return new Line({ id, body, target, motivation, label, type, creator })
    }

    async #saveLineToRerum() {
        const lineAsAnnotation = {
            "@context": "http://iiif.io/api/presentation/3/context.json",
            id: this.id,
            type: this.type ?? "Annotation",
            motivation: this.motivation ?? "transcribing",
            target: this.target,
            creator: await fetchUserAgent(this.creator),
            body: this.body
        }
        if (this.label) lineAsAnnotation.label = { "none": [this.label] }
        if (this.#tinyAction === 'create') {
            await databaseTiny.save(lineAsAnnotation)
                .catch(err => {
                    throw new Error(`Failed to save Line to RERUM: ${err.message}`)
                })
            this.#tinyAction = 'update'
            return this
        }
        // ...else Update the existing page in RERUM
        const existingLine = await fetch(this.id).then(res => res.json())
        .catch(err => {
            if (err.status === 404) {
                // If the line doesn't exist, we can create it
                return null
            }
            throw new Error(`Failed to fetch existing Line from RERUM: ${err.message}`)
        })

        if (!existingLine) {
            // This id doesn't exist in RERUM, so we need to create it
            this.#tinyAction = 'create'
        }
        const updatedLine = existingLine ? { ...existingLine, ...lineAsAnnotation } : lineAsAnnotation
        const newURI = await databaseTiny[this.#tinyAction](updatedLine).then(res => res.id)
        .catch(err => {
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
    if (this.#tinyAction === 'update' || this.body) {
        this.#setRerumId()
        await this.#saveLineToRerum()
    }
    return this.#updateLineForPage()
}

#updateLineForPage() {
    return {
        id: this.id,
        type: this.type ?? "Annotation",
        target: this.target
    }
}
    /**
     * Updates the textual content of the annotation body.
     *
     100→     * Handles various body formats, including arrays of bodies and different textual body variants.
     * Throws errors if the body format is unexpected or ambiguous.
     *
     * @async
     * @param {string} text - The new text content to set.
     * @param {Object} [options={}] - Optional parameters for updating the text.
     * @param {string} [options.format="text/plain"] - The format of the text (e.g., "text/plain").
     * @param {string} [options.language] - The language of the text.
     * @param {string} [options.creator] - The creator of the annotation (applied at the annotation level).
     * @param {string} [options.generator] - The generator of the annotation (applied at the annotation level).
     * @returns {Promise<this>} The updated instance for chaining.
     * @throws {Error} If the text is not a string, or if the body format is unexpected or ambiguous.
     */
    async updateText(text, options = {}) {
        if (typeof text !== 'string') throw new Error('Text content must be a string')
        if (!this.body) this.body = "" // simple variant for no body
        this.creator = options.creator
        const isVariantTextualBody = body => typeof (body?.chars ?? body?.['cnt:asChars'] ?? body?.value ?? body) === 'string'

        if (Array.isArray(this.body)) {
            const textualBodies = this.body.filter(body => isVariantTextualBody(body))
            if (textualBodies.length !== 1) throw new Error(textualBodies.length > 1 ? 'Multiple textual bodies found. Cannot determine which one to update.' : 'No textual body found in the array to update.')

            const textualBody = textualBodies[0]
            const currentValue = textualBody.value ?? textualBody.chars ?? textualBody['cnt:asChars'] ?? textualBody
            if (currentValue === text) return this
            Object.assign(textualBody, { type: 'TextualBody', value: text, format: options.format ?? "text/plain", language: options.language })
            // discard Annotation-level options if only one body entry is modified.
            return this.update()
        }

        if (isVariantTextualBody(this.body)) {
            const currentValue = this.body.chars ?? this.body['cnt:asChars'] ?? this.body.value ?? this.body
            if (currentValue === text) return this
            this.body = { type: 'TextualBody', value: text, format: options.format ?? "text/plain", language: options.language }
            return this.update()
        }

        throw new Error('Unexpected body format. Cannot update text.')
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

    async getFullLine() {
        console.log("getFullLine called for ID:", this.id);
        const isRerumId = this.id.startsWith(process.env.RERUMIDPREFIX);
        console.log("Is Rerum ID:", isRerumId);
        if (isRerumId) {
            try {
                const rerumLine = await fetch(this.id).then(res => res.json());
                console.log("Rerum Line fetched:", rerumLine);
                // Prioritize properties from rerumLine, ensuring correct mapping
                this.type = rerumLine.type || this.type;
                this.motivation = rerumLine.motivation || this.motivation;
                this.label = rerumLine.label?.none?.[0] || rerumLine.label || this.label; // Handle nested label or direct label
                this.body = rerumLine.body || this.body;
                this.target = rerumLine.target || this.target;
                this.creator = rerumLine.creator || this.creator;
                // Any other properties that need to be explicitly set
            } catch (err) {
                console.error(`Failed to fetch full line from RERUM for ID: ${this.id}, returning partial line.`, err);
            }
        }
        console.log("Line instance after getFullLine execution:", this);
        return this;
    }

    asJSON(isLD) {
        const base = {
            id: this.id,
            type: this.type ?? 'Annotation',
            body: this.body ?? '',
            target: this.target ?? '',
            creator: this.creator,
            motivation: this.motivation ?? 'transcribing',
            label: this.label ?? '',
        };

        return isLD ? {
            '@context': 'http://iiif.io/api/presentation/3/context.json',
            ...base
        } : base;
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