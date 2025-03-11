import dbDriver from "../../database/driver.mjs"
const database = new dbDriver("mongo")


/**
 * Class representing a hotkey.
 * @class Hotkeys
 * @param {String} _id - The ID of the hotkey matches the id of the Project it belongs to.
 */
export default class Hotkeys {
    constructor(_id, symbols = []) {
        if (!_id) {
            throw { status: 400, message: "_id is required" }
        }
        this._id = _id
        this.data = { _id, symbols }
    }

    assign(symbols) {
        if (!Array.isArray(symbols) || symbols.some(symbol => typeof symbol !== 'string')) {
            throw { status: 400, message: "All symbols must be strings" }
        }
        if (!Array.isArray(symbols) || symbols.some(symbol => typeof symbol !== 'string')) {
            throw { status: 400, message: "All symbols must be strings" }
        }
        this.data.symbols = symbols
        return this
    }

    add(symbol) {
        if (typeof symbol !== 'string') {
            throw { status: 400, message: "Symbol must be a string" }
        }
        if (!this.data.symbols.includes(symbol)) {
            this.data.symbols.push(symbol)
        }
        return this
    }

    remove(symbol) {
        if (typeof symbol !== 'string') {
            throw { status: 400, message: "Symbol must be a string" }
        }
        this.data.symbols = this.data.symbols.filter(s => s !== symbol)
        return this
    }

    /**
     * Load hotkey data from the database.
     */
    async #loadFromDB() {
        this.data = await database.getById(this._id, process.env.TPENHOTKEYS)
        return this
    }

    /**
     * Create a new hotkey.
     * @param {String} projectId - The ID of the project this hotkey belongs to.
     * @param {Array} symbols - Ordered list of UTF-8 symbols (e.g., ["♠","❤","ϡ"]).
     * @returns {Object} - The created hotkey.
     */
    async create() {
        if (!this.data._id || (this.data.symbols?.length < 1)) {
            throw { status: 400, message: "Cannot create a detached or empty set of hotkeys." }
        }
        try {
            await database.save(this.data, process.env.TPENHOTKEYS)
        } catch (err) {
            // possible collision with existing hotkey or other error
            throw {
                status: err.status || 500,
                message: err.message || "An error occurred while creating the hotkey"
            }
        }
        return this.data
    }

    /**
     * Fetch all hotkeys for a project.
     * @param {String} _id - The ID of the project.
     * @returns {Array} - Array of hotkey objects.
     */
    static async getByProjectId(_id) {
        if (!_id) {
            throw { status: 400, message: "projectId is required" }
        }

        return database.findOne({ _id }, process.env.TPENHOTKEYS)
    }

    /**
     * Update a hotkey.
     * @returns {Object} - The updated hotkey.
     */
    async update() {
        if (!this.data._id || (this.data.symbols?.length < 1)) {
            throw { status: 400, message: "Cannot create a detached or empty set of hotkeys." }
        }
        try {
            await database.update(this.data, process.env.TPENHOTKEYS)
        } catch (err) {
            // server or driver/mongo error
            throw {
                status: err.status || 500,
                message: err.message || "An error occurred while updating the hotkey"
            }
        }
        return this.data
    }

    /**
     * Delete a hotkey.
     * @returns {Boolean} Succeeded.
     */
    async delete() {
        if (!this.data._id) {
            throw { status: 400, message: "Id is required" }
        }

        try {
            await database.delete(this.data._id, process.env.TPENHOTKEYS)
        } catch (err) {
            // server or driver/mongo error
            throw {
                status: err.status || 500,
                message: err.message || "An error occurred while deleting the hotkey"
            }
        }
        return true
    }
}
