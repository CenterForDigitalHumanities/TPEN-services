import dbDriver from "../../database/driver.js"
import { fetchUserAgent } from "../../utilities/shared.js"
import ProjectFactory from "../Project/ProjectFactory.js"
import Line from "../Line/Line.js"

const databaseTiny = new dbDriver("tiny")

export default class Page {
    #tinyAction = 'create'
    #hydrated = false
    #setRerumId() {
        if (!this.id.startsWith(process.env.RERUMIDPREFIX)) {
            this.id = `${process.env.RERUMIDPREFIX}${this.id.split("/").pop()}`
        }
        return this
    }

    /**
     * Constructs a Page from the JSON Object in the Project `layers` Array reference. This 
     * never creates a new Page, but rather wraps existing data in a Page object.
     * Use the `build` method to create a new Page.
     * @param {String} id The ID of the layer. This is the Layer stored in the Project.
     * @param {String} label The label of the layer. This is the Layer stored in the Project.
     * @param {String} target The uri of the targeted Canvas.
     * @param {Array} items The array of Annotation objects.
     * @seeAlso {@link Page.build}
     */
    constructor(layerId, { id, label, target, items = [], creator = null, partOf = null, prev = null, next = null }) {
        if (!id || !target) {
            throw new Error("Page data is malformed.")
        }
        Object.assign(this, { id, label, target, partOf: partOf ?? layerId, items, creator, prev, next })
        if (this.id.startsWith(process.env.RERUMIDPREFIX)) {
            this.#tinyAction = 'update'
        }
        return this
    }

    static build(projectId, layerId, canvas, creator, partOf, prev, next, items = []) {
        if (!projectId) {
            throw new Error("Project ID is required to create a Page instance.")
        }
        if (!layerId) {
            throw new Error("Layer ID is required to create a Page instance.")
        }
        if (!canvas?.id && typeof canvas !== 'string') {
            throw new Error("Canvas with id is required to create a Page instance.")
        }
        if (!canvas.id) {
            canvas = {id : canvas}
        }
        
        const id = items.length
            ? `${process.env.RERUMIDPREFIX}${databaseTiny.reserveId()}`
            : `${process.env.SERVERURL}project/${projectId}/page/${databaseTiny.reserveId()}`
        let canvasLabel = canvas.label ?? `Page ${canvas.id.split('/').pop()}`
        const page = {
            data: {
                "@context": "http://iiif.io/api/presentation/3/context.json",
                id,
                type: "AnnotationPage",
                label: ProjectFactory.getLabelAsString(canvasLabel),
                target: canvas.id,
                creator: creator,
                partOf: partOf ?? `${process.env.SERVERURL}project/${projectId}/layer/${layerId}`,
                items,
                prev,
                next
            }
        }
        return new Page(layerId, page.data)
    }

    /**
     * Resolve the RERUM URI of the Page and sync Page properties with the AnnotationPage properties.
     * The RERUM data will take preferences and overwrite any properties that are already set.
     * Only RERUM URIs are supported.
     */
    async #loadAnnotationPageDataFromRerum() {
        if (this.id.startsWith?.(process.env.RERUMIDPREFIX)) {
            const rawPageData = await fetch(this.id).then(async (resp) => {
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
            if (!(rawPageData.id || rawPageData["@id"])) {
                // A 200 with garbled data, call it a fail
                const genericRerumNetworkError = new Error(`500: ${this.id} - A RERUM error occurred`)
                genericRerumNetworkError.status = 502
                throw genericRerumNetworkError
            }
            this.#tinyAction = 'update'
            this.id = rawPageData.id ?? rawPageData["@id"] ?? this.id
            if ('target' in rawPageData) this.target = rawPageData.target
            if ('items' in rawPageData) this.items = rawPageData.items
            if (rawPageData.creator) this.creator = rawPageData.creator
            if (rawPageData.label) this.label = ProjectFactory.getLabelAsString(rawPageData.label)
            if ('partOf' in rawPageData) this.partOf = Array.isArray(rawPageData.partOf) ? rawPageData.partOf[0]?.id ?? rawPageData.partOf[0] : rawPageData.partOf
            if ('prev' in rawPageData) this.prev = rawPageData.prev
            if ('next' in rawPageData) this.next = rawPageData.next
            this.#hydrated = true
        }
        return this
    }

    /**
     * Resolve all annotations in this Page's items array by fetching their full data from RERUM.
     * Once resolved, replaces this.items with the resolved data.
     *
     * @returns {Promise<Array>} Array of fully resolved annotation objects
     */
    async #loadAnnotationPageItemsFromRerum() {
        if (!Array.isArray(this.items)) return []
        // Process all items in parallel for better performance
        const resolvedItems = await Promise.all(
            this.items.map(async (item) => {
                // If item is a string, it's an annotation ID - fetch from RERUM
                let lineRef
                // target is required by Line constructor but will be overwritten by RERUM data
                // since body will be undefined, Line.asJSON() always calls #loadAnnotationDataFromRerum()
                if (typeof item === "string") lineRef = { "id": item, "target":"pending-resolution" }
                else if (typeof item === "object" && item.id) lineRef = item
                else return { id: item?.id ?? item, error: "Unrecognized Page item format" }
                let line
                try {
                    line = await new Line(lineRef).asJSON(true)
                }
                catch(err) {
                    line = { id: lineRef.id, error: err.message }
                }
                delete line["@context"]
                return line
            })
        )
        return resolvedItems
    }

    async #savePageToRerum() {
        const prev = this.prev ?? null
        const next = this.next ?? null
        const pageAsAnnotationPage = {
            "@context": "http://iiif.io/api/presentation/3/context.json",
            id: this.id,
            type: "AnnotationPage",
            label: { "none": [this.label] },
            items: this.items ?? [],
            prev,
            next,
            creator: await fetchUserAgent(this.creator),
            target: this.target,
            partOf: [{ id: this.partOf, type: "AnnotationCollection" }]
        }
        if (this.#tinyAction === 'create') {
            const saved = await databaseTiny.save(pageAsAnnotationPage)
                .catch(err => {
                    console.error(err, pageAsAnnotationPage)
                    throw new Error(`Failed to save Page to RERUM: ${err.message}`)
                })
            this.#tinyAction = 'update'
            return this
        }
        // ...else Update the existing page in RERUM
        const existingPage = await fetch(this.id).then(async (resp) => {
            if (resp.ok) return resp.json()
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
        if (!(existingPage?.id || existingPage?.["@id"])) {
            const genericRerumNetworkError = new Error(`500: ${this.id} - A RERUM error occurred`)
            genericRerumNetworkError.status = 502
            throw genericRerumNetworkError
        }
        const updatedPage = { ...existingPage, ...pageAsAnnotationPage }
        
        // Handle optimistic locking version if available
        try {
            await databaseTiny.overwrite(updatedPage)
            return this
        } catch (err) {
            if (err.status === 409) {
                const conflictError = new Error(err.message ?? 'Version conflict while saving Page to RERUM')
                conflictError.status = 409
                conflictError.code = 'VERSION_CONFLICT'
                conflictError.details = 'The document was modified by another process.'
                conflictError.currentVersion = err.currentVersion
                throw conflictError
            }
            throw err
        }
    }

    /**
      * Check the Project for any RERUM documents and either upgrade a local version or overwrite the RERUM version.
      *
      * @returns {Promise} Resolves to the updated Layer object as stored in Project.
      */
    async update() {
        const hasContent = this.items?.length || this.items?.some?.(item => item && typeof item === 'object' && 'body' in item)
        if (this.#tinyAction === 'update' || hasContent) {
            this.#setRerumId()
            await this.#savePageToRerum()
        }
        return this.#formatPageForProject()
    }

    /**
     * Resolve all item references in this Page by fetching full annotation data from RERUM.
     * @returns {Promise<Array>} Array of fully resolved annotation objects.
     */
    async resolvePageItems() {
        return this.#loadAnnotationPageItemsFromRerum()
    }

    asProjectPage() {
        return this.#formatPageForProject()
    }

    #formatPageForProject() {
        return {
            id: this.id,
            label: this.label,
            target: this.target,
            items: this.items ?? []
        }
    }

    /**
     * Returns a JSON representation of the Page as a W3C AnnotationPage.
     * @param {boolean} isLD - If true, returns JSON-LD format with @context and type. If false, returns a simple object.
     * @returns {Object} The Page as JSON.
     */
    async asJSON(isLD) {
        if (!this.#hydrated && this.id?.startsWith?.(process.env.RERUMIDPREFIX)) {
            await this.#loadAnnotationPageDataFromRerum()
        }
        let result
        if (isLD) {
            result = {
                '@context': 'http://iiif.io/api/presentation/3/context.json',
                id: this.id,
                type: 'AnnotationPage',
                label: { "none": [this.label] },
                target: this.target,
                partOf: Array.isArray(this.partOf)
                    ? this.partOf
                    : [{ id: this.partOf, type: "AnnotationCollection" }],
                items: this.items ?? [],
                prev: this.prev ?? null,
                next: this.next ?? null
            }
            if (this.creator) result.creator = this.creator
        }
        else {
            result = {
                id: this.id,
                label: this.label,
                target: this.target,
                items: this.items ?? [],
                partOf: this.partOf,
                prev: this.prev ?? null,
                next: this.next ?? null
            }
        }
        return result
    }

    async delete() {
        if (this.#tinyAction === 'update') {
            // associated Annotations in RERUM will be left intact
            await databaseTiny.remove(this.id).catch(err => false)
        }
        return true
    }

}
