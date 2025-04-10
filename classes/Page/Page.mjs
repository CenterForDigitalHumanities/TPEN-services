import dbDriver from "../../database/driver.mjs"

const databaseTiny = new dbDriver("tiny")

export default class Page {

    #setRerumId() {
        if (!this.data.id.startsWith(process.env.RERUMIDPREFIX)) {
            this.data.id = `${process.env.RERUMIDPREFIX}${id.split("/").pop()}`
        }
        return this
    }

    constructor(layerId, canvas, prev, next, lines = []) {
        if(!layerId) {
            throw new Error("Layer ID is required to create a Page instance.")
        }
        if(!canvas || !canvas.id) {
            throw new Error("Canvas with id is required to create a Page instance.")
        }
        
        const canvasId = canvas.id
        const id = lines.length 
            ? `${process.env.RERUMIDPREFIX}${databaseTiny.reserveId()}`
            : `${process.env.SERVERURL}layer/${layerId.split("/").pop()}/page/${databaseTiny.reserveId()}`
        this.data = {
            "@context": "http://www.w3.org/ns/anno.jsonld",
            id,
            type : "AnnotationPage",
            label : canvas.label,
            target : canvas.id,
            partOf: layerId,
            items: lines,
            prev,
            next
        }
        return this
    }
    
    get id() {
        return this.data.id
    }

    upsertRequest() {
        const action = this.data.id.startsWith(process.env.RERUMIDPREFIX) ? "update" : "save"
        return databaseTiny[action](this.data, process.env.TPENPROJECTS)
    }

    async save() {
        return await this.upsertRequest()
    }

    update(data) {
        this.data = data
        this.#setRerumId()
        return this
    }

    patch(data) {
        Object.assign(this.data, data)
        this.#setRerumId()
        return this
    }
}
