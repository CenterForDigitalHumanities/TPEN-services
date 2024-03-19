/**
 * Abstract unit actions that may use any of the registered database controllers.
 * A call comes in stating which database/controller it wants to use and which action it is trying to do.
 */ 

import TinyController from "./tiny/index.mjs"
import MariaController from "./maria/index.mjs"
import MongoController from "./mongo/index.mjs"

class PolyController {
    constructor(dbControllerName=null) {
        if(dbControllerName) this.chooseController(dbControllerName)
    }

    async chooseController(dbControllerName=null){
        if(dbControllerName === null){
            throw new Error("You must provide one of theser controller names: 'mongo' 'maria' 'tiny'")
        }
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
        if(this.controller) await this.controller.connect()    
    }
    
    // end the connection to the active controller and start an active connection with the provided controller
    async connectToNewController(dbControllerName){
        this.controller.close()
        this.chooseController(dbControllerName)
    }

    // Check that the chosen controller has an active connection
    async connected() {
        return await this.controller.connected()
    }

    // Close the connection of the active controller
    async close() {
        await this.controller.close()
    }

    // Create through the correct db controller
    async create(document) {
        const result = await this.controller.create(document)
        console.log(result)
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
