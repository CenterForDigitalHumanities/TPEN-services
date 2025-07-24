import dbDriver from "../../database/driver.js"
import { handleVersionConflict } from "../../utilities/shared.js"
import { fetchUserAgent } from "../../utilities/shared.js"

const databaseTiny = new dbDriver("tiny")

export default class Page {
    #tinyAction = 'create'
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

        const page = {
            data: {
                "@context": "http://www.w3.org/ns/anno.jsonld",
                id,
                type: "AnnotationPage",
                label: canvas.label ?? `Page ${canvas.id.split('/').pop()}`,
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

    async #savePageToRerum() {
        const pageAsAnnotationPage = {
            "@context": "http://www.w3.org/ns/anno.jsonld",
            id: this.id,
            type: "AnnotationPage",
            label: { "none": [this.label] },
            items: this.items ?? [],
            ...this?.prev && {
              prev: this.prev
            },
            ...this?.next && {
              next: this.next
            },
            creator: await fetchUserAgent(this.creator),
            target: this.target,
            partOf: [{ id: this.partOf, type: "AnnotationCollection" }]
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
        
        // Handle optimistic locking version if available
        try {
            await databaseTiny.overwrite(updatedPage)
            return this
        } catch (err) {
            if (err.status === 409) {
                throw handleVersionConflict(null, err)
            }
            throw err
        }
    }

    /**
      * Check the Project for any RERUM documents and either upgrade a local version or overwrite the RERUM version.
      * @returns {Promise} Resolves to the updated Layer object as stored in Project.
      */
    async update(rerum = false) {
        if (rerum || this.#tinyAction === 'update' || this.items?.length) {
            this.#setRerumId()
            await this.#savePageToRerum()
        }
        return this.#formatPageForProject()
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

    async delete() {
        if (this.#tinyAction === 'update') {
            // associated Annotations in RERUM will be left intact
            await databaseTiny.remove(this.id).catch(err => false)
        }
        return true
    }

}
