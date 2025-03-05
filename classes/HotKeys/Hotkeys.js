import dbDriver from "../../database/driver.mjs"
const database = new dbDriver("mongo")

export default class Hotkeys {
    constructor(_id = database.reserveId()) {
        this._id = _id
        this.data = { _id }
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
     * @param {String} symbol - The UTF-8 symbol (e.g., "♠").
     * @param {String} shortcut - The shortcut assigned to the symbol (e.g., "Ctrl + 1").
     * @returns {Object} - The created hotkey.
     */
    async createHotkey(projectId, symbol, shortcut) {
        if (!projectId || !symbol || !shortcut) {
            throw { status: 400, message: "projectId, symbol, and shortcut are required" }
        }

        this.data = {
            _id: this._id,
            projectId,
            symbol,
            shortcut,
        }

        await this.save()
        return this.data
    }

    /**
     * Fetch all hotkeys for a project.
     * @param {String} projectId - The ID of the project.
     * @returns {Array} - Array of hotkey objects.
     */
    async getHotkeysByProjectId(projectId) {
        if (!projectId) {
            throw { status: 400, message: "projectId is required" }
        }

        return database.find({ projectId }, process.env.TPENHOTKEYS)
    }

    /**
     * Update a hotkey.
     * @param {String} hotkeyId - The ID of the hotkey to update.
     * @param {Object} updates - An object containing the fields to update (e.g., { symbol: "♥", shortcut: "Ctrl + 2" }).
     * @returns {Object} - The updated hotkey.
     */
    async updateHotkey(hotkeyId, updates) {
        if (!hotkeyId) {
            throw { status: 400, message: "hotkeyId is required" }
        }

        const hotkey = await database.getById(hotkeyId, process.env.TPENHOTKEYS)
        if (!hotkey) {
            throw { status: 404, message: "Hotkey not found" }
        }

        Object.assign(hotkey, updates)
        await database.update(hotkey, process.env.TPENHOTKEYS)
        return hotkey
    }

    /**
     * Delete a hotkey.
     * @param {String} hotkeyId - The ID of the hotkey to delete.
     * @returns {Object} - The deleted hotkey.
     */
    async deleteHotkey(hotkeyId) {
        if (!hotkeyId) {
            throw { status: 400, message: "hotkeyId is required" }
        }

        const hotkey = await database.getById(hotkeyId, process.env.TPENHOTKEYS)
        if (!hotkey) {
            throw { status: 404, message: "Hotkey not found" }
        }

        await database.remove(hotkeyId, process.env.TPENHOTKEYS)
        return hotkey
    }

    /**
     * Save the hotkey to the database.
     */
    async save() {
        return database.save(this.data, process.env.TPENHOTKEYS)
    }

    /**
     * Update the hotkey in the database.
     */
    async update() {
        return database.update(this.data, process.env.TPENHOTKEYS)
    }
}