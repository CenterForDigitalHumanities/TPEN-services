import dbDriver from "../../database/driver.js"

const databaseTiny = new dbDriver("tiny")

export default class Page {

    #tinyAction = 'create'
    #setRerumId() {
        if (this.#tinyAction === 'create') {
            this.id = `${process.env.RERUMIDPREFIX}${this.id.split("/").pop()}`
        }
        return this
    }

    /**
     * Constructs a Page from the JSON Object in the Project `layers` Array reference. This 
     * never creates a new Page, but rather wraps existing data in a Page object.
     * Use the `build` method to create a new Page.
     * @param {hexString} projectId For the project this layer belongs to
     * @param {String} id The ID of the layer. This is the Layer stored in the Project.
     * @param {String} label The label of the layer. This is the Layer stored in the Project.
     * @param {String} target The uri of the targeted Canvas.
     * @seeAlso {@link Page.build}
     */
    constructor(layerId, { id, label, target, lines }) {
        if (!id || !target) {
            throw new Error("Page data is malformed.")
        }
        Object.assign(this, { id, label, target, partOf: layerId, lines })
        if (this.id.startsWith(process.env.RERUMIDPREFIX)) {
            this.#tinyAction = 'update'
        }
        return this
    }

    static build(projectId, layerId, canvas, prev, next, lines = []) {
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
        
        const id = lines.length
            ? `${process.env.RERUMIDPREFIX}${databaseTiny.reserveId()}`
            : `${process.env.SERVERURL}project/${projectId}/page/${databaseTiny.reserveId()}`

        const page = {
            data: {
                "@context": "http://www.w3.org/ns/anno.jsonld",
                id,
                type: "AnnotationPage",
                label: canvas.label ?? `Page ${canvas.id.split('/').pop()}`,
                target: canvas.id,
                partOf: layerId,
                items: lines,
                prev,
                next
            }
        }

        return new Page(layerId, page.data)
    }

    async #savePageToRerum() {
        const pageAsAnnotationPage = {
            "@context": "http://www.w3.org/ns/anno.jsonld",
            id: this.id,
            type: "AnnotationPage",
            label: { "none": [this.label] },
            target: this.target,
            partOf: this.partOf,
            items: this.data.items ?? [],
            prev: this.prev ?? null,
            next: this.next ?? null
        }
        if (this.#tinyAction === 'create') {
            await databaseTiny.save(pageAsAnnotationPage)
                .catch(err => {
                    console.error(err, pageAsAnnotationPage)
                    throw new Error(`Failed to save Page to RERUM: ${err.message}`)
                })
            this.#tinyAction = 'update'
            return this
        }
        // ...else Update the existing page in RERUM
        const existingPage = await fetch(this.id).then(res => res.json())
        if (!existingPage) {
            throw new Error(`Failed to find Page in RERUM: ${this.id}`)
        }
        const updatedPage = { ...existingPage, ...pageAsAnnotationPage }
        await databaseTiny.overwrite(updatedPage)
        return this
    }

    /**
     * Check the Project for any RERUM documents and either upgrade a local version or overwrite the RERUM version.
     * @returns {Promise} Resolves to the updated Layer object as stored in Project.
     */
    async update() {
        if (this.#tinyAction === 'update' || this.items.length) {
            this.#setRerumId()
            await this.#savePageToRerum()
        }
        return this.#updatePageForProject()
    }

    asProjectPage() {
        return this.#updatePageForProject()
    }

    #updatePageForProject() {
        // Page in local MongoDB is in the Project.layers.pages Array and looks like:
        // { 
        //   id: "https://api.t-pen.org/layer/layerID/page/pageID", 
        //   label: "Page 1", 
        //   target: "https://canvas.uri" 
        // }
        return {
            id: this.id,
            label: this.label,
            target: this.target,
            lines: this.lines ?? []
        }
    }

    async delete() {
        if (this.#tinyAction === 'update') {
            // associated Annotations in RERUM will be left intact
            await databaseTiny.remove(this.id)
                .catch(err => false)
        }
        return true
    }
}
