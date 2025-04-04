/**
 * Abstract unit actions that may use any of the registered database controllers. 
 * This driver gives instructions to the specific controllers.
 * Downstream logic initializes a driver and chooses a controller.
 * No matter which controller they choose, they have access to regularized unit functionality.
 * Additional controllers can be included in the /database directory as necessary.
 * 
 * @author Bryan Haberberger, cubap
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
        if (dbControllerName === null) throw new Error("No controller name provided")
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
            } catch (err) {
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
     * @param collection Optional collection override
     * @return The inserted document JSON or error JSON
     */
    async save(data, collection) {
        data._createdAt = new Date()
        collection ??= resolveCollection(data)
        if (!collection) throw new Error("Cannot determine collection for save operation")
        return this.controller.save(data, collection)
    }

    /**
     * Update an existing object in the database
     * @param data JSON from an HTTP POST request. It must contain an id.
     * @param collection Optional collection override
     * @return The updated document JSON or error JSON
     */
    async update(data, collection) {
        data._modifiedAt = new Date()
        collection ??= resolveCollection(data)
        if (!collection) throw new Error("Cannot determine collection for update operation")
        return this.controller.update(data, collection)
    }

    /**
     * Remove an existing object from the database
     * @param data JSON from an HTTP DELETE request. It must contain an id.
     * @param collection Optional collection override
     * @return The delete result JSON or error JSON
     */
    async delete(data, collection) {
        collection ??= resolveCollection(data)
        if (!collection) throw new Error("Cannot determine collection for delete operation")
        return this.controller.remove(data, collection)
    }

    /**
     * Get data from the database that have matching property values.
     * @param query JSON from an HTTP POST request. It must contain at least one property.
     * @param collection Optional collection override
     * @return JSON Array of matched documents or standard error object
     */
    async find(query, collection) {
        collection ??= resolveCollection(query)
        if (!collection) throw new Error("Cannot determine collection for find operation")
        return this.controller.find(query, collection)
    }

    /**
     * Find a single document matching the query
     * @param query JSON from an HTTP POST request. It must contain at least one property.
     * @param collection Optional collection override
     * @return Single document JSON or error
     */
    async findOne(query, collection) {
        collection ??= resolveCollection(query)
        if (!collection) throw new Error("Cannot determine collection for findOne operation")
        return this.controller.findOne(query, collection)
    }

    /**
     * Get a database record by its ID.
     * @param id The ID of the record to retrieve.
     * @param collection Optional collection override
     * @return JSON of the matched document or standard error object
     */
    async getById(id, collection) {
        // Note: Can't determine collection from just an ID
        if (!collection) throw new Error("Collection required for getById operation")
        return this.controller.getById(id, collection)
    }

    /**
     * Reserve a valid ID from the database for use in building a record 
     * without collision.
     * @return The reserved ID or error JSON
     */
    reserveId() {
        return this.controller.reserveId()
    }

    /**
     * Check if the submitted chars represent a valid id in the current controller.
     * @param id The id to check.
     * @return boolean
     */
    isValidId(id) {
        return this.controller.isValidId(id)
    }

    /**
     * Create a valid ID from a supplied string or number.
     * @param id The id to validify.
     * @return string | number
     */
    asValidId(id) {
        return this.controller.asValidId(id)
    }
}

export default dbDriver

/**
* Data belongs to or goes into different collections. The data 'type' usually tells us which one.
* If no type is found on the data, use the provided override, if any.
* 
* @param data A data object or query object. The type will correspond to a collection
* @param override If no type is on 'data', consider the provided override to be the type.
* @return a known type string, such as "Project", or null
*/ 
function determineDataType(data, override) {
 if (data._sub) return "User"
 if (data.members) return "Group"
 if (data.group) return "Project"
 if (data.target && data.items) return "Page"
 if (data.target && data.body) return "Line"
 return override ?? data["@type"] ?? data.type
}

/**
 * Determine the collection name based on data type.
 * 
 * @param type A type string, such as "Project", or null
 * @return the corresponding collection name from environment variables
 */
function discernCollectionFromType(type) {
  if (!type) return null
  
  switch (type) {
    case "Project":
    case "Page":
    case "Line":
      return process.env.TPENPROJECTS
    case "Group":
      return process.env.TPENGROUPS
    case "User":
      return process.env.TPENUSERS
    default:
      return null
  }
}

/**
 * Determine the appropriate collection based on data and/or override.
 * 
 * @param data The data object to analyze
 * @param collectionOverride Optional collection override
 * @return Appropriate collection name
 */
function resolveCollection(data, collectionOverride) {
  if (collectionOverride) return collectionOverride
  
  const type = determineDataType(data)
  if (!type) return null
  
  return discernCollectionFromType(type)
}
