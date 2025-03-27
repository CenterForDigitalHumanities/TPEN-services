import dbDriver from "../../database/driver.mjs"
import path from "path"

const database = new dbDriver("mongo")

export default class Layer {
    constructor(_id) {
        this._id = _id
        this.data = null
        this.layer = null
    }
    
    get id() {
        return this.layer.id
    }

    set id(id) {
        this.layer.id = id
    }

    async addLayer(layer) {
        await this.#load()
        const label = asLanguageMap(layer?.label ?? `${this.data.label ?? "Default"} - Layer ${Date.now()}`)
        const canvases = layer.canvases

        try {
            const responses = await Promise.all(canvases.map(canvas => fetch(canvas)))
            const data = await Promise.all(responses.map(response => response.json()))
            
            const layerAnnotationCollection = {
              "@context": "http://www.w3.org/ns/anno.jsonld",
              "id": `${process.env.RERUMIDPREFIX}${database.reserveId()}`,
              type: "AnnotationCollection",
              label,
              items: []
            }

            await Promise.all(data.map(async (canvas) => {
              const annotationsItems = await Promise.all(canvas.annotations.map(async (annotation) => {
              const response = await fetch(annotation.id)
              const annotationData = await response.json()
              const annotationItems = {
                id: annotationData.id ?? annotationData["@id"],
                type: annotationData.type,
                label: annotationData.label,
                items: [],
                target: annotationData.target,
                partOf: [{
                  id: `${database.reserveId()}`,
                  label: annotationData.label,
                }],
                next: annotationData.next,
                prev: annotationData.prev
              }
              layerAnnotationCollection.creator = annotationData.creator
              return annotationItems
              }))
              layerAnnotationCollection.items.push(...annotationsItems)
            }))
            layerAnnotationCollection.total = layerAnnotationCollection.items.length
            layerAnnotationCollection.first = layerAnnotationCollection.items[0].id
            layerAnnotationCollection.last = layerAnnotationCollection.items[layerAnnotationCollection.items.length - 1].id          
            this.layer.push(layerAnnotationCollection)
            this.updateLayer(this.layer)
            return layerAnnotationCollection
        } catch (error) {
            console.error('Error fetching data:', error)
        }
    }

    async updateLayer(layer) {
        this.data.layers = layer
        return await this.update()
    }
    
    async deleteLayer(layerId) {
        await this.#load()
        this.layer = this.layer.filter(layer => (layer.id ?? layer["@id"]) !== `${process.env.RERUMIDPREFIX}${layerId}`)
        this.data.layers = this.layer
        return await this.update()
    }

    async updatePages(layerId, pages) {
        await this.#load()
        this.layer = this.layer.map(layer => {
            if((layer.id ?? layer["@id"]) === `${process.env.RERUMIDPREFIX}${layerId}`)
            {
                layer.items = pages
                .map((page, index) => {
                    const itemIndex = layer.items.findIndex((item) => page === (item.id ?? item["@id"]))
                    if (itemIndex !== -1 && itemIndex !== index) {
                    const item = layer.items[itemIndex]
                        return {
                            id: item.id ?? item["@id"],
                            type: item.type,
                            label: item.label,
                            items: item.items,
                            target: item.target,
                            partOf: [{
                            id: `${process.env.RERUMIDPREFIX}${database.reserveId()}`,
                            label: item.label,
                            }],
                            next: item.next,
                            prev: item.prev
                        }
                    }
                    else {
                        return layer.items[itemIndex]
                    }
                })
                .filter(Boolean)
                layer.total = pages.length
                layer.first = pages[0]
                layer.last = pages[pages.length - 1]
            }
            return layer
        })
        this.data.layers = this.layer
        return await this.update()
    }
    
    async update() {
        return await database.update(this.data, process.env.TPENPROJECTS)
    }

    async #load() {
        return database.getById(this._id, process.env.TPENPROJECTS).then((resp) => {
            this.data = resp
            this.layer = resp.layers
        })
    }
}

function asLanguageMap(value) {
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value
    }
    return Array.isArray(value) ? { none: value } : { none: [value] }
}