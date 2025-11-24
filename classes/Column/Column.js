import dbDriver from "../../database/driver.js"
const database = new dbDriver("mongo")

/**
 * Represents a Column entity that organizes line annotations within a page.
 * Columns provide a way to structure transcription content into logical groupings.
 *
 * @class Column
 */
export default class Column {
    /**
     * Creates a new Column instance.
     *
     * @param {string} [_id=database.reserveId()] - The unique identifier for this column
     */
    constructor(_id = database.reserveId()) {
        this._id = _id
        this.data = null
    }

    /**
     * Gets the column data from the database if not already loaded.
     *
     * @returns {Promise<Object>} The column data object
     * @throws {Error} If the column cannot be loaded from the database
     */
    async getColumnData() {
        if(!this.data) {
            await this.#loadFromDB()
        }
        return this.data
    }

    /**
     * Loads the column data from the database.
     *
     * @private
     * @returns {Promise<Column>} This Column instance with loaded data
     * @throws {Error} If the database operation fails
     */
    async #loadFromDB() {
        try {
            this.data = await database.getById(this._id, process.env.TPENCOLUMNS)
            if (!this.data) {
                throw new Error(`Column with ID '${this._id}' not found`)
            }
            return this
        } catch (error) {
            throw new Error(`Failed to load column from database: ${error.message}`)
        }
    }

    /**
     * Saves the column data to the database.
     *
     * @returns {Promise<Object>} The saved column record
     * @throws {Error} If the save operation fails or data is missing
     */
    async save() {
        try {
            if (!this.data) {
                throw new Error('Cannot save column: data is null or undefined')
            }
            return await database.save(this.data, process.env.TPENCOLUMNS)
        } catch (error) {
            throw new Error(`Failed to save column: ${error.message}`)
        }
    }

    /**
     * Updates the column data in the database.
     *
     * @returns {Promise<Object>} The updated column record
     * @throws {Error} If the update operation fails or data is missing
     */
    async update() {
        try {
            if (!this.data) {
                throw new Error('Cannot update column: data is null or undefined')
            }
            return await database.update(this.data, process.env.TPENCOLUMNS)
        } catch (error) {
            throw new Error(`Failed to update column: ${error.message}`)
        }
    }

    /**
     * Deletes the column from the database.
     *
     * @returns {Promise<Object>} The result of the delete operation
     * @throws {Error} If the delete operation fails
     */
    async delete() {
        try {
            return await database.delete(this._id, process.env.TPENCOLUMNS)
        } catch (error) {
            throw new Error(`Failed to delete column: ${error.message}`)
        }
    }

    /**
     * Creates a new column with the specified properties and saves it to the database.
     *
     * @static
     * @param {string} pageId - The ID of the page this column belongs to
     * @param {string} projectId - The ID of the project this column belongs to
     * @param {string} label - The label/name for this column
     * @param {string[]} [annotations=[]] - Array of annotation IDs in this column
     * @param {boolean} [unordered=false] - Whether this column represents unordered content
     * @returns {Promise<Object>} The saved column record
     * @throws {Error} If validation fails or the save operation fails
     */
    static async createNewColumn(pageId, projectId, label, annotations=[]) {
        try {
            // Input validation
            if (!pageId || typeof pageId !== 'string') {
                throw new Error('pageId must be a non-empty string')
            }
            if (!projectId || typeof projectId !== 'string') {
                throw new Error('projectId must be a non-empty string')
            }
            if (!label || typeof label !== 'string' || label.trim().length === 0) {
                throw new Error('label must be a non-empty string')
            }
            if (!Array.isArray(annotations)) {
                throw new Error('annotations must be an array')
            }

            let newColumn = new Column()
            newColumn.data = {
                _id: newColumn._id,
                label: label,
                onPage: pageId,
                inProject: projectId,
                next: null,
                prev: null,
                lines: annotations
            }
            return await newColumn.save()
        } catch (error) {
            throw new Error(`Failed to create new column: ${error.message}`)
        }
    }
}
