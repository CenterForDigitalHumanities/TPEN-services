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
        const layerLabel = layer.label
        const canvases = layer.canvases

        await this.#load()
    
        try {
          const responses = await Promise.all(canvases.map(canvas => fetch(canvas)))
          const data = await Promise.all(responses.map(response => response.json()))
          const layerAnnotationCollection = {
            "@id": Date.now(),
            label: { none : [ layerLabel ?? `New Layer - ${this.layer.length + 1}` ] },
            pages: await Promise.all(data.map(async (canvas) => {
              const annotationsItems = await Promise.all(canvas.annotations.map(async (annotation) => {
              const response = await fetch(annotation.id)
              const annotationData = await response.json()
              const annotationItems = {
                id: annotationData.id ?? annotationData["@id"],
                type: annotationData.type,
                label: annotationData.label,
                items: [],
                creator: annotationData.creator,
                target: annotationData.target,
                partOf: [{
                  id: `Temp-${Date.now()}`,
                  type: "AnnotationCollection",
                  label: annotationData.label,
                  items: canvas.annotations.map(item => {
                    return {
                      id: item.id,
                      type: "AnnotationPage",
                      label: path.parse(item.id.substring(item.id.lastIndexOf("/") + 1)).name,
                      target: annotationData.target
                      }
                    }
                  ),
                  total: canvas.annotations.length,
                  first: canvas.annotations[0].id,
                  last: canvas.annotations[canvas.annotations.length - 1].id,
                  creator: annotationData.creator
                }],
                next: annotationData.next,
                prev: annotationData.prev
              }
              return annotationItems
            }))
            return annotationsItems
          }))
        }
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
        this.layer = this.layer.filter(layer => layer["@id"] !== parseInt(layerId))
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
