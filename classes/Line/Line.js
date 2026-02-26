import dbDriver from "../../database/driver.js"
import { fetchUserAgent, hasAnnotationChanges } from "../../utilities/shared.js"
const databaseTiny = new dbDriver("tiny")

export default class Line {

    #tinyAction = 'create'
    #setRerumId() {
        if (!this.id.startsWith(process.env.RERUMIDPREFIX)) {
            this.id = `${process.env.RERUMIDPREFIX}${this.id.split("/").pop()}`
        }
        return this
    }

    constructor({ id, target, body, motivation, label, type, creator = null }) {
        if (!id || !target) 
            throw new Error('Line data is malformed.')
        this.id = id // Ensure the id is assigned
        this.body = body
        this.target = target
        this.creator = creator
        if (id.startsWith?.(process.env.RERUMIDPREFIX)) {
            this.#tinyAction = 'update'
        }
        if (motivation) this.motivation = motivation
        if (label) this.label = label
        if (type) this.type = type
        return this
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
            body: this.body ?? []
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
        // ...else Update the existing line in RERUM
        const existingLine = await fetch(this.id).then(async (resp) => {
            if (resp.ok) return resp.json()
            if (resp.status === 404) return null
            let rerumErrorMessage = `${resp.status ?? 500}: ${this.id} - `
            try {
                rerumErrorMessage += await resp.text()
            } catch (err) {
                rerumErrorMessage = undefined
            }
            const err = new Error(rerumErrorMessage ?? `${resp.status ?? 500}: ${this.id} - A RERUM error occurred`)
            err.status = 502
            throw err
        })
        .catch(err => {
            if (err.status === 502) throw err
            const genericRerumNetworkError = new Error(`500: ${this.id} - A RERUM error occurred`)
            genericRerumNetworkError.status = 502
            throw genericRerumNetworkError
        })
        if (!(existingLine?.id || existingLine?.["@id"])) {
            // This id doesn't exist in RERUM, so we need to create it
            this.#tinyAction = 'create'
        }
        // Skip RERUM update if no content changes detected
        // Uses hasAnnotationChanges from shared.js instead of a private Class method for testability.
        if (existingLine && !hasAnnotationChanges(existingLine, lineAsAnnotation)) {
            return this  // Return without versioning
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

    #updateLineForPage() {
        return {
            id: this.id,
            type: this.type ?? "Annotation",
            target: this.target
        }
    }

    /**
     * Resolve the RERUM URI of the Line and sync Line properties with the Annotation properties.
     * The RERUM data will take preferences and overwrite any properties that are already set.
     * Only RERUM URIs are supported.
     */
    async #loadAnnotationDataFromRerum() {
        if (this.id.startsWith?.(process.env.RERUMIDPREFIX)) {
            const rawLineData = await fetch(this.id).then(async (resp) => {
                if (resp.ok) return resp.json()
                // The response from RERUM indicates a failure, likely with a specific code and textual body
                let rerumErrorMessage = `${resp.status ?? 500}: ${this.id} - `
                try {
                   rerumErrorMessage += await resp.text()
                }
                catch (err) {
                   rerumErrorMessage = undefined
                }
                const err = new Error(rerumErrorMessage ?? `${resp.status ?? 500}: ${this.id} - A RERUM error occurred`)
                err.status = 502
                throw err
            })
            .catch(err => {
                if (err.status === 502) throw err
                const genericRerumNetworkError = new Error(`500: ${this.id} - A RERUM error occurred`)
                genericRerumNetworkError.status = 502
                throw genericRerumNetworkError
            })
            if (!(rawLineData.id || rawLineData["@id"])) {
                // A 200 with garbled data, call it a fail
                const genericRerumNetworkError = new Error(`500: ${this.id} - A RERUM error occurred`)
                genericRerumNetworkError.status = 502
                throw genericRerumNetworkError
            }
            // We don't have Class getters and setters for these properties...
            if ('body' in rawLineData) this.body = rawLineData.body
            if (rawLineData.target) this.target = rawLineData.target
            if (rawLineData.creator) this.creator = rawLineData.creator
            if (rawLineData.motivation) this.motivation = rawLineData.motivation
            if (rawLineData.label) this.label = rawLineData.label
            if (rawLineData.type) this.type = rawLineData.type
            this.#tinyAction = 'update'
        }
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

    /**
     * Updates the textual content of the annotation body.
     *
     * Handles various body formats, including arrays of bodies and different textual body variants.
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

        if (Array.isArray(this.body)) {
            const textualBodies = this.body.filter(body => isVariantTextualBody(body))
            if (textualBodies.length !== 1) throw new Error(textualBodies.length > 1 ? 'Multiple textual bodies found. Cannot determine which one to update.' : 'No textual body found in the array to update.')

            const textualBody = textualBodies[0]
            const currentValue = extractTextValue(textualBody)
            if (currentValue === text) return this
            Object.assign(textualBody, { type: 'TextualBody', value: text, format: options.format ?? "text/plain", language: options.language })
            // discard Annotation-level options if only one body entry is modified.
            return this.update()
        }

        if (isVariantTextualBody(this.body)) {
            const currentValue = extractTextValue(this.body)
            if (currentValue === text) return this
            this.body = { type: 'TextualBody', value: text, format: options.format ?? "text/plain", language: options.language }
            return this.update()
        }

        throw new Error('Unexpected body format. Cannot update text.')
    }

    updateTargetXYWH(target, x, y, w, h) {
        if (typeof target === "object" && target.selector?.value) {
            const hasPixel = target.selector.value.includes("pixel:")
            const prefix = hasPixel ? "xywh=pixel:" : "xywh="
            return {
                ...target,
                selector: {
                    ...target.selector,
                    value: `${prefix}${x},${y},${w},${h}`
                }
            }
        }

        if (typeof target === "object" && target.id) {
            const hasPixel = /xywh=pixel/.test(target.id)
            const prefix = hasPixel ? "#xywh=pixel:" : "#xywh="
            return {
                ...target,
                id: target.id.replace(/#xywh(=pixel)?:?.*/, `${prefix}${x},${y},${w},${h}`)
            }
        }

        if (typeof target === "string") {
            const hasPixel = /xywh=pixel/.test(target)
            const prefix = hasPixel ? "#xywh=pixel:" : "#xywh="
            if (target.includes("#xywh")) {
                return target.replace(/#xywh(=pixel)?:?.*/, `${prefix}${x},${y},${w},${h}`)
            }
            return `${target}#xywh=pixel:${x},${y},${w},${h}`
        }
        throw new Error("Unsupported target format")
    }

    async updateBounds({x, y, w, h}, options = {}) {
        const isValidBound = v => (Number.isInteger(v) && v >= 0) || (typeof v === 'string' && /^\d+$/.test(v))
        if (!isValidBound(x) || !isValidBound(y) || !isValidBound(w) || !isValidBound(h)) {
            throw new Error('Bounds ({x,y,w,h}) must be non-negative integers')
        }
        x = parseInt(x, 10); y = parseInt(y, 10); w = parseInt(w, 10); h = parseInt(h, 10)
        if (options.creator) this.creator = options.creator
        this.target ??= ''
        const newTarget = this.updateTargetXYWH(this.target, x, y, w, h)
        if (this.target === newTarget) {
            return this
        }
        this.target = newTarget
        return this.update()
    }

    async asJSON(isLD) {
        if (this.body === undefined) await this.#loadAnnotationDataFromRerum()
        const result = isLD ? {
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
        if (isLD && this.creator) result.creator = this.creator
        return result
    }

    asHTML() {
        return Promise.resolve('<html><body>This is the HTML document content.</body></html>')
    }

    /**
     * Extract the plain text content from the Line body.
     *
     * @returns {string} The text content of the Line, or empty string if no textual body exists.
     */
    async asTextBlob() {
        if (this.body === undefined) await this.#loadAnnotationDataFromRerum()
        return extractTextFromAnnotationBody(this.body)
    }

    async delete() {
        if (this.#tinyAction === 'update') {
            await databaseTiny.remove(this.id)
                .catch(err => false)
        }
        return true
    }
}

/**
 * Extract the text value from a textual body entry.
 * Priority: value → cnt:asChars → chars → raw body.
 *
 * @param {string|Object} body - A textual body entry.
 * @returns {string|*} The text string if a known text property exists, otherwise the raw body value.
 */
function extractTextValue(body) {
    return body?.value ?? body?.['cnt:asChars'] ?? body?.chars ?? body
}

/**
 * Determine whether the given body entry is a textual body variant.
 * Recognizes: plain string, object with `value`, `chars`, or `cnt:asChars` string property.
 *
 * @param {*} body - A single body entry (string, object, or other).
 * @returns {boolean} True if the body is a textual body variant.
 */
function isVariantTextualBody(body) {
    return typeof extractTextValue(body) === 'string'
}

/**
 * Extract the plain text content from raw Annotation body data
 * Handles all W3C Web Annotation body format variants:
 * - Plain string body
 * - Object body with `value`, `chars`, or `cnt:asChars` property
 * - Array of bodies (returns text from the first textual body found)
 * - null/undefined/empty array bodies return empty string
 *
 * @param {*} body - A single body entry (string, object, array, or other).
 * @returns {string} The text content of the annotation, or empty string if no textual body exists.
 */
function extractTextFromAnnotationBody(body) {
    if (body === null || body === undefined) return ''
    if (Array.isArray(body)) {
        const textualBody = body.find(b => isVariantTextualBody(b))
        if (!textualBody) return ''
        return extractTextValue(textualBody)
    }
    if (isVariantTextualBody(body)) {
        return extractTextValue(body)
    }
    return ''
}
