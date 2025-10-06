import dbDriver from "../../database/driver.js"
import { handleVersionConflict } from "../../utilities/shared.js"
import Page from "../Page/Page.js"
import { fetchUserAgent } from "../../utilities/shared.js"
import ProjectFactory from "../Project/ProjectFactory.js"

const databaseTiny = new dbDriver("tiny")

export default class Layer {
    #tinyAction = 'create'

    /**
     * Constructs a Layer from the JSON Object in the Project `layers` Array.
     * This never creates a new Layer, but rather wraps existing data in a Layer object.
     * Use the `build` method to create a new Layer.
     * @param {hexString} projectId For the project this layer belongs to
     * @param {string} id The ID of the layer. This is the Layer stored in the Project.
     * @param {string} label The label of the layer. This is the Layer stored in the Project.
     * @param {Array} pages The pages in the layer by reference.
     * @seeAlso {@link Layer.build}
     */
    constructor(projectId, { id, label, pages, creator = null }) {
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
        return this.#formatCollectionForProject()
    }

    asProjectLayer() {
        return this.#formatCollectionForProject()
    }

    // Private Methods
    #setRerumId() {
        if (!this.id.startsWith(process.env.RERUMIDPREFIX)) {
            this.id = `${process.env.RERUMIDPREFIX}${this.id.split("/").pop()}`
        }
        return this
    }

    #formatCollectionForProject() {
        return {
            id: this.id,
            label: this.label,
            pages: this.pages.map(p => new Page(this.id, p).asProjectPage())
        }
    }

    #getPageReference({ id, label, target }) {
        label ??= id.split("/").pop()
        const resolvedLabel = label.none?.join(", ") ?? label.en?.join(", ") ?? label
        return { id, label: resolvedLabel, target }
    }

    async #saveCollectionToRerum() {
        const layerAsCollection = {
            "@context": "http://www.w3.org/ns/anno.jsonld",
            id: this.id,
            type: "AnnotationCollection",
            label: { "none": [this.label] },
            creator: await fetchUserAgent(this.creator),
            total: this.pages.length,
            first: this.pages.at(0).id,
            last: this.pages.at(-1).id
        }

        if (this.#tinyAction === 'create') {
            await databaseTiny.save(layerAsCollection).catch(err => {
                console.error(err, layerAsCollection)
                throw new Error(`Failed to save Layer to RERUM: ${err.message}`)
            })
            this.#tinyAction = 'update'
            return this
        }

        const existingLayer = await fetch(this.id).then(res => res.json())
        if (!existingLayer) {
            throw new Error(`Layer not found in RERUM: ${this.id}`)
        }
        const updatedLayer = { ...existingLayer, ...layerAsCollection }
        
        // Handle optimistic locking version if available        
        try {
            await databaseTiny.overwrite(updatedLayer)
            return this
        } catch (err) {
            if (err.status === 409) {
                throw handleVersionConflict(null, err)
            }
            throw err
        }
    }
}
