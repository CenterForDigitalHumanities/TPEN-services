/**
 * Abstract unit actions that may use any of the registered database controllers.
 * A call comes in stating which database/controller it wants to use and which action it is trying to do.
 */ 

import TinyController from "./tiny/index.mjs"
import MariaController from "./maria/index.mjs"
import MongoController from "./mongo/index.mjs"

class PolyController {

    /**
     * Basic constructor to establish constant class properties
     * @param connect A boolean for whether or not to attempt to open a connection to the mongo client immediately.
     */ 
    constructor(dbControllerName=null) {
        // May construct with a chosen controller which will automatically set the active controller
        if(dbControllerName) this.chooseController(dbControllerName)
    }

    /**
     * Set or change the active controller
     * @param dbControllerName The name of the controller to connect to.
     * Expected names are
     *    - mongo
     *    - maria
     *    - tiny
     */ 
    async chooseController(dbControllerName=null){
        // Must provide a controller name
        if(dbControllerName === null) throw new Error("You must provide one of theser controller names: 'mongo' 'maria' 'tiny'")
        // Nothing to do if the controller is already active
        if(this?.dbControllerName === dbControllerName) throw new Error(`'${dbControllerName}' is already the active controller.`)
        // If there is an active controller, close the connection before switching
        if(this?.controller) this.controller.close()
        switch(dbControllerName){
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
        if(this.controller !== null) {
            this.dbControllerName = dbControllerName
            await this.controller.connect()    
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
    async create(data) {
        const result = await this.controller.create(data)
        if(result.endpoint_error) console.error(result)
        return result
    }

    /**
     * Update an existing object in the database
     * @param data JSON from an HTTP POST request.  It must contain an id.
     * @return The updated document JSON or error JSON
     */ 
    async update(data) {
        const result = await this.controller.update(data)
        if(result.endpoint_error) console.error(result)
        return result
    }

    /**
     * Remove an existing object from the database
     * @param data JSON from an HTTP DELETE request.  It must contain an id.
     * @return The delete result JSON or error JSON
     */ 
    async remove(data) {
        const result = await this.controller.remove(data)
        if(result.endpoint_error) console.error(result)
        return result
    }

    /**
     * Get data from the database that have matching property values.
     * @param query JSON from an HTTP POST request.  It must contain at least one property.
     * @return JSON Array of matched documents or standard error object
     */ 
    async read(query) {
        const result = await this.controller.read(query)
        if(result.endpoint_error) console.error(result)
        return result
    }
}

export default PolyController
