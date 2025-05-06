import dbDriver from "../../database/driver.js"

const databaseTiny = new dbDriver("tiny")
const databaseMongo = new dbDriver("mongo")

export default class Page {
    #tinyAction = 'create'

    #setRerumId() {
        if (this.#tinyAction === 'create') {
            this.id = `${process.env.RERUMIDPREFIX}${this.id.split("/").pop()}`
        }
        return this
    }

    /**
     * Constructs a Page by wrapping existing data in a Page object.
     * Use the `build` method to create a new Page.
     * @param {String} partOf The layer ID this page belongs to
     * @param {Object} canvas An object with { id, label, target } properties
     */
    constructor(layerId, { id, label, target }) {
        console.log("Page constructor", layerId, id, label, target)
        if (!id || !target) {
            throw new Error("Page data is malformed.")
        }
        Object.assign(this, { id, label, target, partOf: layerId })
        if (this.id.startsWith(process.env.RERUMIDPREFIX)) {
            this.#tinyAction = 'update'
        }
        return this
    }

    static build(projectId, layerId, canvas, prev, next, lines = []) {
        if (!layerId) {
            throw new Error("Layer ID is required to create a Page instance.")
        }
        if (!canvas || !canvas.id) {
            throw new Error("Canvas with id is required to create a Page instance.")
        }
        const id = lines.length
            ? `${process.env.RERUMIDPREFIX}${databaseTiny.reserveId()}`
            : `${process.env.SERVERURL}layer/${layerId.split("/").pop()}/page/${databaseTiny.reserveId()}`
        const page = {
            data: {
                "@context": "http://www.w3.org/ns/anno.jsonld",
                id,
                type: "AnnotationPage",
                label: canvas.label,
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
    async update(userId) {
        const hasItems = Array.isArray(this.data?.items) && this.data.items.length > 0
        if (this.#tinyAction === 'update' || hasItems) {
            this.#setRerumId()
            await this.#savePageToRerum()
            await this.#recordModification(userId)
        }
        return this.#updatePageForProject()
    }

    asProjectPage() {
        return this.#updatePageForProject()
    }

    async #updatePageForProject() {
        // Page in local MongoDB is in the Project.layers.pages Array and looks like:
        // { 
        //   id: "https://api.t-pen.org/layer/layerID/page/pageID", 
        //   label: "Page 1", 
        //   target: "https://canvas.uri" 
        // }
        return {
            id: this.id,
            label: this.label,
            target: this.target
        }
    }

    async delete() {
        if (this.#tinyAction === 'update') {
            // associated Annotations in RERUM will be left intact
            await databaseTiny.remove(this.id).catch(err => false)
        }
        return true
    }

    async #recordModification(userId) {
        try {
            const { id: pageId, partOf: projectId = this.partOf } = this
            await databaseMongo.controller.db
                .collection(process.env.TPENPROJECTS)
                .updateOne(
                    { _id: projectId },
                    {
                        $set: {
                            _lastModified: pageId,
                            _modifiedAt: new Date()
                        }
                    }
                )

            if (userId) {
                await databaseMongo.controller.db
                    .collection(process.env.TPENUSERS)
                    .updateOne(
                        { _id: userId },
                        {
                            $set: {
                                _lastModified: pageId,
                                _modifiedAt: new Date()
                            }
                        }
                    )
            }
        } catch (err) {
            console.error("recordModification failed", err)
        }
    }
}
