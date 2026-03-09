import dbDriver from "../../database/driver.js"
import Page from "../Page/Page.js"
import { fetchUserAgent } from "../../utilities/shared.js"
import ProjectFactory from "../Project/ProjectFactory.js"

const databaseTiny = new dbDriver("tiny")

export default class Layer {
    #tinyAction = 'create'
    #hydrated = false

    /**
     * Constructs a Layer from the JSON Object in the Project `layers` Array.
     * This never creates a new Layer, but rather wraps existing data in a Layer object.
     * Use the `build` method to create a new Layer.
     * @param {hexString} projectId For the project this layer belongs to
     * @param {string} id The ID of the layer. This is the Layer stored in the Project.
     * @param {string} label The label of the layer. This is the Layer stored in the Project.
     * @param {Array} pages The pages in the layer by reference.
     * @param {string|null} [creator=null] The creator/agent URI for this layer.
     * @param {number} [total] The total number of pages. Defaults to pages.length.
     * @param {string} [first] The ID of the first page. Defaults to pages[0].id.
     * @param {string} [last] The ID of the last page. Defaults to pages[-1].id.
     * @seeAlso {@link Layer.build}
     */
    constructor(projectId, { id, label, pages, creator = null, total, first, last }) {
        if (!projectId) {
            throw new Error("Project ID is required to create a Layer instance.")
        }
        if (!id || !label || !pages) {
            throw new Error("Layer data is malformed.")
        }
        this.projectId = projectId
        this.id = id
        this.label = label
        this.creator = creator
        this.pages = pages
        this.total = total ?? pages.length
        this.first = first ?? pages.at(0)?.id
        this.last = last ?? pages.at(-1)?.id
        if (this.id.startsWith(process.env.RERUMIDPREFIX)) {
            this.#tinyAction = 'update'
        }
        return this
    }

    // Static Methods
    static build(projectId, label, canvases, creator, projectLabel = "Default") {
        if (!Array.isArray(canvases)) {
            if (!canvases) {
                throw new Error("At least one Canvas must be included.")
            }
            canvases = [canvases]
        }

        const thisLayer = {
            projectId,
            label: ProjectFactory.getLabelAsString(label) ?? `${projectLabel} - Layer ${Date.now()}`,
            creator,
            id: `${process.env.SERVERURL}project/${projectId.split('/').pop()}/layer/${databaseTiny.reserveId()}`
        }
        const pages = canvases.map(c => Page.build(projectId, thisLayer.id, c).asProjectPage())
        pages.forEach((page, index) => {
            if (index > 0) page.prev = pages[index - 1].id
            if (index < pages.length - 1) page.next = pages[index + 1].id
            page.partOf = thisLayer.id
            page.creator = thisLayer.creator
        })
        return new Layer(projectId, { id: thisLayer.id, label: thisLayer.label, pages, creator: thisLayer.creator })
    }

    // Public Methods
    async delete() {
        if (this.#tinyAction === 'update') {
            await Promise.all(this.pages.map(page => {
                const p = new Page(this.id, page)
                return p.delete()
            }))
            await databaseTiny.remove(this.id).catch(err => false)
        }
        return true
    }

    async update() {
        if (this.#tinyAction === 'update' || this.pages.some(page => page.id.startsWith(process.env.RERUMIDPREFIX))) {
            this.#setRerumId()
            await this.#saveCollectionToRerum()
        }
        this.total = this.pages.length
        this.first = this.pages.at(0)?.id
        this.last = this.pages.at(-1)?.id
        this.#hydrated = true
        return this.#formatCollectionForProject()
    }

    asProjectLayer() {
        return this.#formatCollectionForProject()
    }

    /**
     * Returns a JSON representation of the Layer as a W3C AnnotationCollection.
     * @param {boolean} isLD - If true, returns JSON-LD format with @context and type. If false, returns a simple object.
     * @returns {Promise<Object>} The Layer as JSON.
     */
    async asJSON(isLD) {
        if (!this.#hydrated && this.id?.startsWith?.(process.env.RERUMIDPREFIX)) {
            await this.#loadAnnotationCollectionDataFromRerum()
        }
        let result
        if (isLD) {
            result = {
                '@context': 'http://iiif.io/api/presentation/3/context.json',
                id: this.id,
                type: 'AnnotationCollection',
                label: { "none": [this.label] },
                total: this.total,
                first: this.first,
                last: this.last
            }
            if (this.creator) result.creator = this.creator
        }
        else {
            result = {
                id: this.id,
                label: this.label,
                pages: this.pages,
                creator: this.creator
            }
        }
        return result
    }

    // Private Methods
    #setRerumId() {
        if (!this.id.startsWith(process.env.RERUMIDPREFIX)) {
            this.id = `${process.env.RERUMIDPREFIX}${this.id.split("/").pop()}`
        }
        return this
    }

    /**
     * Resolve the RERUM URI of the Layer and sync Layer properties with the AnnotationCollection properties.
     * The RERUM data will take preference and overwrite any properties that are already set.
     * Only RERUM URIs are supported.
     */
    async #loadAnnotationCollectionDataFromRerum() {
        if (this.id.startsWith?.(process.env.RERUMIDPREFIX)) {
            const rawLayerData = await fetch(this.id).then(async (resp) => {
                if (resp.ok) return resp.json()
                let rerumErrorMessage
                try {
                    rerumErrorMessage = `${resp.status ?? 500}: ${this.id} - ${await resp.text()}`
                } catch (e) {
                    rerumErrorMessage = `500: ${this.id} - A RERUM error occurred`
                }
                const err = new Error(rerumErrorMessage)
                err.status = 502
                throw err
            })
            .catch(err => {
                if (err.status === 502) throw err
                const genericRerumNetworkError = new Error(`500: ${this.id} - A RERUM error occurred`)
                genericRerumNetworkError.status = 502
                throw genericRerumNetworkError
            })
            if (!(rawLayerData.id || rawLayerData["@id"])) {
                const genericRerumNetworkError = new Error(`500: ${this.id} - A RERUM error occurred`)
                genericRerumNetworkError.status = 502
                throw genericRerumNetworkError
            }
            this.#tinyAction = 'update'
            this.id = rawLayerData.id ?? rawLayerData["@id"] ?? this.id
            if (rawLayerData.label) this.label = ProjectFactory.getLabelAsString(rawLayerData.label)
            if (rawLayerData.creator) this.creator = rawLayerData.creator
            if ('total' in rawLayerData) this.total = rawLayerData.total
            if ('first' in rawLayerData) this.first = rawLayerData.first
            if ('last' in rawLayerData) this.last = rawLayerData.last
            this.#hydrated = true
        }
        return this
    }

    #formatCollectionForProject() {
        return {
            id: this.id,
            label: this.label,
            pages: this.pages.map(p => {
                const page = new Page(this.id, p).asProjectPage()
                if (p.columns) page.columns = p.columns
                return page
            })
        }
    }

    async #saveCollectionToRerum() {
        const layerAsCollection = {
            "@context": "http://iiif.io/api/presentation/3/context.json",
            id: this.id,
            type: "AnnotationCollection",
            label: { "none": [this.label] },
            creator: await fetchUserAgent(this.creator),
            total: this.pages.length,
            first: this.pages.at(0)?.id,
            last: this.pages.at(-1)?.id
        }

        if (this.#tinyAction === 'create') {
            await databaseTiny.save(layerAsCollection)
            .catch(err => {
                console.error(err, layerAsCollection)
                throw new Error(`Failed to save Layer to RERUM: ${err.message}`)
            })
            this.#tinyAction = 'update'
            this.#hydrated = true
            return this
        }

        const existingLayer = await fetch(this.id).then(async (resp) => {
            if (resp.ok) return resp.json()
            let rerumErrorMessage
            try {
                rerumErrorMessage = `${resp.status ?? 500}: ${this.id} - ${await resp.text()}`
            } catch (e) {
                rerumErrorMessage = `500: ${this.id} - A RERUM error occurred`
            }
            const err = new Error(rerumErrorMessage)
            err.status = 502
            throw err
        })
        .catch(err => {
            if (err.status === 502) throw err
            const genericRerumNetworkError = new Error(`500: ${this.id} - A RERUM error occurred`)
            genericRerumNetworkError.status = 502
            throw genericRerumNetworkError
        })
        if (!(existingLayer?.id || existingLayer?.["@id"])) {
            const genericRerumNetworkError = new Error(`500: ${this.id} - A RERUM error occurred`)
            genericRerumNetworkError.status = 502
            throw genericRerumNetworkError
        }
        const updatedLayer = { ...existingLayer, ...layerAsCollection }
        await databaseTiny.overwrite(updatedLayer)
        this.#hydrated = true
        return this
    }
}
