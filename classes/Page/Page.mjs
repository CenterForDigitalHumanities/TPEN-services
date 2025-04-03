import dbDriver from "../../database/driver.mjs"

const database = new dbDriver("mongo")

export default class Page {

    constructor(data) {
        this.data = data
        this.projectId = null
        this.layerId = null
    }
    
    get id() {
        return this.data.id
    }

    set id(id) {
        this.data.id = id
    }

    async saveCollectionToRerum(projectId, layerId) {
        this.projectId = projectId
        this.layerId = layerId
        const layer = this.data.layers.find(layer => String(layer.id).split("/").pop() === `${layerId}`)
        const pageItems = layer.pages.map(page => ({
            id : `${process.env.RERUMIDPREFIX}${database.reserveId()}`,
            type : "AnnotationPage",
            label : page.label,
            partOf : {
                id : `${process.env.RERUMIDPREFIX}${layerId}`,
                label : layer.label
            },
            target : page.target
        }))

        pageItems.forEach((pageItem, index) => {
            pageItem.next = pageItems[index + 1]?.id ?? null
            pageItem.prev = pageItems[index - 1]?.id ?? null
        })

        const addCollection = {
            "@context": "http://www.w3.org/ns/anno.jsonld",
            id : `${process.env.RERUMIDPREFIX}${layerId}`,
            type : "AnnotationCollection",
            label : layer.label,
            items : pageItems,
            total : pageItems.length,
            first : pageItems[0].id,
            last : pageItems[pageItems.length - 1].id
        }
        console.log(addCollection.items)
        return addCollection
    }

    async update() {
        return await database.update(this.data, process.env.TPENPROJECTS)
    }
}