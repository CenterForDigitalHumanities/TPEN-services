import dbDriver from "../../database/driver.mjs"

const database = new dbDriver("mongo")

export default class Layer {
    constructor() {
        this.data = null
        this.projectId = null
    }
    
    get id() {
        return this.data.id
    }

    set id(id) {
        this.data.id = id
    }

    async addLayer(layer, projectId, projectLabel) {
        this.projectId = projectId
        await this.#load()
        const label = layer?.label ?? `${projectLabel ?? "Default"} - Layer ${Date.now()}`
        const canvases = layer.canvases

        try {
            const layerAnnotationCollection = {
                "id": `${process.env.RERUMIDPREFIX}${database.reserveId()}`,
                label,
                pages: canvases.map(element => ({
                    id: `temp${database.reserveId()}`,
                    label: `Default - ${element.split("/").pop().split(".")[0]}`,
                    target: element
                }))
            }
                      
            this.data.push(layerAnnotationCollection)
            return await this.update()
        } catch (error) {
            console.error('Error fetching data:', error)
        }
    }
    
    async deleteLayer(layerId, projectId) {
        this.projectId = projectId
        await this.#load()
        this.data = this.data.filter(layer => (layer.id ?? layer["@id"]) !== `${process.env.RERUMIDPREFIX}${layerId}`)
        return await this.update()
    }

    // async updatePages(layerId, pages) {
    //     await this.#load()
    //     this.layer = this.layer.map(layer => {
    //         if((layer.id ?? layer["@id"]) === `${process.env.RERUMIDPREFIX}${layerId}`)
    //         {
    //             layer.items = pages
    //             .map((page, index) => {
    //                 const itemIndex = layer.items.findIndex((item) => page === (item.id ?? item["@id"]))
    //                 if (itemIndex !== -1 && itemIndex !== index) {
    //                 const item = layer.items[itemIndex]
    //                     return {
    //                         id: `${process.env.RERUMIDPREFIX}${database.reserveId()}`,
    //                         type: item.type,
    //                         label: item.label,
    //                         items: item.items,
    //                         target: item.target,
    //                         partOf: item.partOf,
    //                         next: item.next,
    //                         prev: item.prev
    //                     }
    //                 }
    //                 else {
    //                     return layer.items[itemIndex]
    //                 }
    //             })
    //             .filter(Boolean)
    //             layer.total = pages.length
    //             layer.first = pages[0]
    //             layer.last = pages[pages.length - 1]
    //         }
    //         return layer
    //     })
    //     this.data.layers = this.layer
    //     return await this.update()
    // }

    // async updateLayerMetadata(layerId, label) {
    //     await this.#load()
    //     this.layer = this.layer.map(layer => {
    //         if((layer.id ?? layer["@id"]) === `${process.env.RERUMIDPREFIX}${layerId}`)
    //         {
    //             layer.label = label.label
    //         }
    //         return layer
    //     })
    //     this.data.layers = this.layer
    //     return await this.update()
    // }

    async update() {
        return await database.updateOne("layers", this.data, process.env.TPENPROJECTS, this.projectId)
    }

    async #load() {
        return database.getById(this.projectId, process.env.TPENPROJECTS).then((resp) => {
            this.data = resp.layers
        })
    }
}