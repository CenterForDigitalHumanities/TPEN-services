/**
 * Abstract unit actions that may use any of the registered database controllers.
 * A call comes in stating which database/controller it wants to use and which action it is trying to do.
 */ 

import TinyController from "./tiny/index.mjs"
import MariaController from "./maria/index.mjs"
import MongoController from "./mongo/index.mjs"

class PolyController {
    constructor(dbControllerName=null) {
        // May construct with a chosen controller which will automatically set the active controller
        if(dbControllerName) this.chooseController(dbControllerName)
    }

    // Set or Change the active controller.
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
            this.controller.connect()    
        }
    }

    // Check that the chosen controller has an active connection
    async connected() {
        return await this.controller.connected()
    }

    // Close the connection of the active controller
    async close() {
        return await this.controller.close()
    }

    // Create through the correct db controller
    async create(data) {
        const result = await this.controller.create(data)
        //if(result.endpoint_error) console.error(result)
        return result
    }

    // Update through the correct db controller
    async update(document, matchParams) {
        const result = await this.controller.update(document)
        console.log(result)
        return result
    }

    // Delete through the correct db controller
    async remove(document) {
        const result = await this.controller.remove(document)
        console.log(result)
        return result
    }

    // Query through the correct db controller
    async read(params) {
        const result = await this.controller.read(document)
        console.log(result)
        return result
    }
}

export default PolyController
