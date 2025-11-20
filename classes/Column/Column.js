import dbDriver from "../../database/driver.js"
const database = new dbDriver("mongo")

export default class Column {
    constructor(_id = database.reserveId()) {
        this._id = _id
        this.data = null
    }

    async getColumnData() {
        if(!this.data) {
            await this.#loadFromDB()
        }
        return this.data
    }

    async #loadFromDB() {
        this.data = await database.getById(this._id, process.env.TPENCOLUMNS)
        return this
    }

    async save() {
        return await database.save(this.data, process.env.TPENCOLUMNS)
    }

    async update() {
        return await database.update(this.data, process.env.TPENCOLUMNS)
    }

    async delete() {
        return await database.delete(this._id, process.env.TPENCOLUMNS)
    }

    static async createNewColumn(pageId, projectId, label, annotations=[], unordered=false) {
        let newColumn = new Column()
        newColumn.data = {
            _id: newColumn._id,
            label: label,
            onPage: pageId,
            inProject: projectId,
            next: null,
            previous: null,
            lines: annotations,
            unordered: unordered
        }
        return await newColumn.save()
    }
}
