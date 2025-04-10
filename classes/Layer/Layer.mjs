import dbDriver from "../../database/driver.mjs"

const database = new dbDriver("mongo")
const databaseTiny = new dbDriver("tiny")

export default class Layer {
    constructor(data) {
        this.data = data
        this.projectId = null
    }
    
    get id() {
        return this.data.id
    }

    set id(id) {
        this.data.id = id
    }

    async addLayer(projectId, labelAndCanvases, projectLabel) {
        this.projectId = projectId
        const label = labelAndCanvases?.label ?? `${projectLabel ?? "Default"} - Layer ${Date.now()}`
        const canvases = labelAndCanvases.canvases

        try {
            const newLayer = {
                "id": `${process.env.RERUMIDPREFIX}${database.reserveId()}`,
                label,
                pages: canvases.map(element => ({
                    id: `temp${database.reserveId()}`,
                    label: `Default - ${element.split("/").pop().split(".")[0]}`,
                    target: element
                }))
            }
                      
            this.data.layers.push(newLayer)
            await this.update()
            return newLayer
        } catch (error) {
            console.error('Error fetching data:', error)
        }
    }
    
    async deleteLayer(projectId, layerId) {
        this.projectId = projectId
        this.data.layers = this.data.layers.filter(layer => (layer.id ?? layer["@id"]) !== `${process.env.RERUMIDPREFIX}${layerId}`)
        await this.update()
        return this.data.layers
    }

    async updatePages(layerId, pages) {
        this.data.layers = this.data.layers.map(layer => {
            if((layer.id ?? layer["@id"]) === `${process.env.RERUMIDPREFIX}${layerId}`)
            {
                layer.pages = pages
                .map((page) => {
                    const itemIndex = layer.pages.findIndex((item) => page === (item.id ?? item["@id"]))
                    if (itemIndex !== -1) {
                        return layer.pages[itemIndex]
                    }
                })
                .filter(Boolean)
            }
            return layer
        })
        await this.update()
        return this.data.layers
    }

    async updateLayerMetadata(layerId, label) {
        this.data.layers = this.data.layers.map(layer => {
            if((layer.id ?? layer["@id"]) === `${process.env.RERUMIDPREFIX}${layerId}`)
            {
                layer.label = label.label
            }
            return layer
        })
        await this.update()
        return this.data.layers
    }

    async update() {
        return await database.update(this.data, process.env.TPENPROJECTS)
    }

    async saveCollectionToRerum() {
        const pageItems = this.pages.map(page => ({
            id: `${process.env.RERUMIDPREFIX}${databaseTiny.reserveId()}`,
            type: "AnnotationPage",
            label: page.label,
            target: page.target
        }))

        const addCollection = {
            "@context": "http://www.w3.org/ns/anno.jsonld",
            id: `${process.env.RERUMIDPREFIX}${this.layerId}`,
            type: "AnnotationCollection",
            label: layer.label.split(" - ")[0],
            items: pageItems,
            total: pageItems.length,
            first: pageItems[0].id,
            last: pageItems[pageItems.length - 1].id
        }

        pageItems.forEach((pageItem, index) => {
            pageItem.partOf = {
                id: addCollection.id,
                label: addCollection.label
            }
            if (pageItems[index + 1]?.id) pageItem.next = pageItems[index + 1].id
            if (pageItems[index - 1]?.id) pageItem.prev = pageItems[index - 1].id
        })
        return this.save(addCollection)
    }

    async save(data) {
        // Implement save logic for Layer
    }
}
