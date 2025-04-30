import dbDriver from "../../database/driver.js"

const database = new dbDriver("mongo")
const databaseTiny = new dbDriver("tiny")

import Page from "../Page/Page.js"

export default class Layer {
    #tinyAction = 'create'
/**
 * Constructs a Layer from the JSON Object in the Project `layers` Array. This 
 * never creates a new Layer, but rather wraps existing data in a Layer object.
 * Use the `build` method to create a new Layer.
 * @param {hexString} projectId For the project this layer belongs to
 * @param {string} id The ID of the layer. This is the Layer stored in the Project.
 * @param {string} label The label of the layer. This is the Layer stored in the Project.
 * @param {Array} pages The pages in the layer by reference.
 * @seeAlso {@link Layer.build}
 */
    constructor(projectId, {id, label, pages}) {
        if (!projectId) {
            throw new Error("Project ID is required to create a Layer instance.")
        }
        if (!id || !label || !pages) {
            throw new Error("Layer data is malformed.")
        }
        this.projectId = projectId
        this.id = id
        this.label = label
        this.pages = pages.map(this.#getPageReference)
        if(this.id.startsWith(process.env.RERUMIDPREFIX)) {
            this.#tinyAction = 'update'
        }
        return this
    }
    
    static build(projectId, label, canvases, projectLabel = "Default") {
        let thisLayer = {}
        projectId ??= database.reserveId()
        thisLayer.projectId = projectId
        thisLayer.label = label ?? `${projectLabel} - Layer ${Date.now()}`
        
        if (!Array.isArray(canvases)) {
            if (!canvases) {
                throw new Error("At least one Canvas must be included.")
            } 
            canvases = [canvases]
        }
        thisLayer.id = `${process.env.SERVERURL}layer/${databaseTiny.reserveId()}`
        const pages = canvases.map(c => Page.build(thisLayer.id, c))
        
        pages.forEach((page, index) => {
            if (index > 0) page.prev = pages[index - 1].id
            if (index < pages.length - 1) page.next = pages[index + 1].id
        })
        const newLayer = new Layer(projectId, { id: thisLayer.id, label: thisLayer.label, pages })
        return newLayer
    }

    #setRerumId() {
        if (this.#tinyAction === 'create') {
            this.id = `${process.env.RERUMIDPREFIX}${id.split("/").pop()}`
        }
        return this
    }

    async delete() {
        if(this.#tinyAction === 'update') {
            // delete the associated pages in RERUM
            await Promise.all(this.pages.map(page => {
                const p = new Page(this.id, page)
                return p.delete()
            }))
            await databaseTiny.remove(this.id)
            .catch(err => false)
        }
        return true
    }

    /**
     * Check the Project for any RERUM documents and either upgrade a local version or overwrite the RERUM version.
     * @returns {Promise} Resolves to the updated Layer object as stored in Project.
     */
    async update() {
        if (this.#tinyAction === 'update' || this.pages.some(page => page.id.startsWith(process.env.RERUMIDPREFIX))) {
            await this.#setRerumId().#saveCollectionToRerum()
        }
        return this.#updateCollectionForProject()
    }

    asProjectLayer() {
        return this.#updateCollectionForProject()
    }

    #updateCollectionForProject() {
        // Layer in local MongoDB is in the Project.layers Array and looks like:
        // { 
        //   label: "Layer 1", 
        //   id: "https://api.t-pen.org/layer/layerID",
        //   pages: [ { id: "https://api.t-pen.org/layer/layerID/page/pageID", label: "Page 1" } ] 
        // }
        return {
            label: this.label,
            id: this.id,
            pages: this.pages.map(this.#getPageReference)
        }
    }

    #getPageReference({ id, label, target }) {
        return { id, label, target }
    }

    async #saveCollectionToRerum() {
        // Layer in Rerum is an AnnotationCollection and looks like:
        // {
        //   "@context": "http://www.w3.org/ns/anno.jsonld",
        //   id: "https://store.t-pen.org/v1/id/layerID",
        //   type: "AnnotationCollection",
        //   label: { "none": ["Layer 1"] },
        //   items: [ "https://store.t-pen.org/v1/id/pageID" ],
        //   total: 1,
        //   first: "https://store.t-pen.org/v1/id/pageID",
        //   last: "https://store.t-pen.org/v1/id/pageID"
        // }

        const layerAsCollection = {
            "@context": "http://www.w3.org/ns/anno.jsonld",
            id: this.id,
            type: "AnnotationCollection",
            label: { "none": [this.label] },
            total: this.pages.length,
            first: this.pages.at(0).id,
            last: this.pages.at(-1).id
        }

        if (this.#tinyAction === 'create') {
            await databaseTiny.save(layerAsCollection)
            .catch(err => {
                console.error(err,layerAsCollection)
                throw new Error(`Failed to save Layer to RERUM: ${err.message}`)
            })
            this.#tinyAction = 'update'
            return this
        }
        // ...else Update the existing collection in RERUM
        const existingLayer = await fetch(this.id).then(res => res.json())
        if (!existingLayer) {
            throw new Error(`Layer not found in RERUM: ${this.id}`)
        }
        updatedLayer = { ...existingLayer, ...layerAsCollection }
        await databaseTiny.overwrite(updatedLayer)
        return this
    }
}
