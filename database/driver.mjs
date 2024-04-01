/**
 * Abstract unit actions that may use any of the registered database controllers. 
 * This driver gives instructions to the specific controllers.
 * Downstream logic initializes a driver and chooses a controller.
 * No matter which controller they choose, they have access to regularized unit functionality.
 * Additional controllers can be included in the /database directory as necessary.
 * 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 * 
 */

import TinyController from "./tiny/controller.mjs"
import MariaController from "./maria/controller.mjs"
import MongoController from "./mongo/controller.mjs"

class dbDriver {

    /**
     * Basic constructor to establish constant class properties
     * @param connect A boolean for whether or not to attempt to open a connection to the mongo client immediately.
     */
    constructor(dbControllerName = null) {
        // May construct with a chosen controller which will automatically set the active controller
        if (dbControllerName) this.chooseController(dbControllerName)
    }

    /**
     * Set or change the active controller.  Alias for "connect to controller"
     * @param dbControllerName The name of the controller to connect to.
     * Expected names are
     *    - mongo
     *    - maria
     *    - tiny
     */
    async chooseController(dbControllerName = null) {
        // Must provide a controller name
        if (dbControllerName === null) throw new Error("You must provide one of theser controller names: 'mongo' 'maria' 'tiny'")
        // Nothing to do if the controller is already active
        if (this?.dbControllerName === dbControllerName) throw new Error(`'${dbControllerName}' is already the active controller.`)
        // If there is an active controller, close the connection before switching
        if (this?.controller) this.controller.close()
        switch (dbControllerName) {
            case "mongo":
                this.controller = new MongoController()
                break
            case "maria":
                this.controller = new MariaController()
                break
            case "tiny":
                this.controller = new TinyController()
                break
            default:
                this.controller = null
                throw new Error(`No registered db for '${dbControllerName}'`)
        }
        // If we were able to discern a controller, connect to that controller
        if (this.controller !== null) {
            this.dbControllerName = dbControllerName
            try {
                await this.controller.connect()
            } catch(err){
                console.error(`Controller '${dbControllerName}' had trouble connecting.`)
                throw err
            }
        }
        return
    }

    /** 
     * Generally check that the controller has an active connection.
     * @return boolean
     * */
    async connected() {
        return await this.controller.connected()
    }

    /** Close the connection with the active controller */
    async close() {
        return await this.controller.close()
    }

    /**
     * Create a new object in the database
     * @param data JSON from an HTTP POST request
     * @return The inserted document JSON or error JSON
     */
    async save(data) {
        return this.controller.save(data).catch(err => err)
    }

    /**
     * Update an existing object in the database
     * @param data JSON from an HTTP POST request.  It must contain an id.
     * @return The updated document JSON or error JSON
     */
    async update(data) {
        // Note this may just be an alias for save()
        return this.controller.update(data).catch(err => err)
    }

    /**
     * Remove an existing object from the database
     * @param data JSON from an HTTP DELETE request.  It must contain an id.
     * @return The delete result JSON or error JSON
     */
    async delete(data) {
        return this.controller.remove(data).catch(err => err)
    }

    /**
     * Get data from the database that have matching property values.
     * @param query JSON from an HTTP POST request.  It must contain at least one property.
     * @return JSON Array of matched documents or standard error object
     */
    async find(query) {
        return this.controller.find(query).catch(err => err)
    }
}

export default dbDriver