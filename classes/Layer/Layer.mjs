import dbDriver from "../../database/driver.mjs"

const database = new dbDriver("mongo")

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
}