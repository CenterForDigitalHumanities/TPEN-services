/**
 * A MongoDB Controller.  Actions here specifically interact with the set MongoDB Database.
 * @see env.MONGODB
 *
 * @author Bryan Haberberger
 * https://github.com/thehabes
 */

import {MongoClient, ObjectId} from "mongodb"
import dotenv from "dotenv"
let storedEnv = dotenv.config()
let err_out = Object.assign(new Error(), {
  status: 123,
  message: "N/A",
  _dbaction: "N/A"
})

/**
 * This mongo controller oversees multiple collections.
 * Requests have to determine which collection they go to based on the user input.
 * User input does not specifically designate a collection as part of the request.
 * A collection is programatically chosen based on the 'type' of the input JSON.
 * Expected types
 *    - Project
 *    - Page
 *    - Group
 *    - User
 *    - UserPreferences
 * All other object types result in a "Bad Request"
 */
function discernCollectionFromType(type) {
  let collection = null
  if (!type) return collection
  switch (type) {
    case "Project":
    case "Page":
      collection = process.env.TPENPROJECTS
      break
    case "Group":
      collection = process.env.TPENGROUPS
      break
    case "User":
    case "UserPreferences":
      collection = process.env.TPENUSERS
      break
    default:
  }
  return collection
}

class DatabaseController {
  /**
   * Basic constructor.
   * @param connect A boolean for whether or not to attempt to open a connection to the mongo client immediately.
   */
  constructor(connect = false) {
    if (connect) this.connect()
  }

  /**
   * Set the client for the controller and open a connection
   * */
  async connect() {
    try {
      this.client = new MongoClient(process.env.MONGODB)
      this.db = this.client.db(process.env.MONGODBNAME)
      await this.client.connect()
      console.log("MongoDB Connection Successful")
      console.log(process.env.MONGODB)
      return
    } catch (err) {
      console.error("MongoDB Connection Failed")
      console.error(process.env.MONGODB)
      console.error(err)
      throw err
    }
  }

  /**
   * Determine if the provided chars are a valid local MongoDB ObjectID().
   * @param id the string to check
   * @return boolean
   */
  isValidId(id) {
    // Expect a String, Integer, or Hexstring-ish
    try {
      if (ObjectId.isValid(id)) {
        return true
      }
      const intTest = Number(id)
      if (!isNaN(intTest) && ObjectId.isValid(intTest)) {
        return true
      }
      if (ObjectId.isValid(id.padStart(24, "0"))) {
        return true
      }
      // possible slug string
      if (typeof id === "string" && id.length > 5) {
        return true
      }
    } catch (err) {
      // just false
    }
    return false
  }

  asValidId(id) {
    if (ObjectId.isValid(id)) {
      return id
    }
    return id
      .toString()
      .replace(/[^0-9a-f]/gi, "")
      .substring(0, 24)
      .padStart(24, "0")
  }

  /** Close the connection with the mongo client */
  async close() {
    await this.client.close()
    console.log("Mongo controller client has been closed")
    return
  }

  /**
   * Generate an new mongo _id as a hex string (as opposed _id object, for example)
   * @return A hex string or error
   * */

  reserveId(seed) {
    try {
      return new ObjectId(seed).toHexString()
    } catch (err) {
      return new ObjectId().toHexString()
    }
  }

  /**
   * Generally check that the controller has an active connection
   * @return boolean
   * */
  async connected() {
    // Send a ping to confirm a successful connection
    try {
      let result = await this.db.command({ping: 1}).catch((err) => {
        return false
      })
      result = result.ok ? true : false
      return result
    } catch (err) {
      console.error(err)
      return false
    }
  }

  /**
   * Get by property matches and return all objects that match
   * @param query JSON from an HTTP POST request.  It must contain at least one property.
   * @return JSON Array of matched documents or standard error object
   */
  validateAndDetermineCollection(query) {
    err_out._dbaction = "find"
    const data_type = query["@type"] ?? query.type
    if (!data_type) {
      err_out.message = `Cannot find 'type' on this data, and so cannot figure out a collection for it.`
      err_out.status = 400
      throw err_out
    }
    const collection = discernCollectionFromType(data_type)
    if (!collection) {
      err_out.message = `Cannot figure which collection for object of type '${data_type}'`
      err_out.status = 400
      throw err_out
    }
    if (Object.keys(query).length === 0) {
      err_out.message = `Empty or null query detected.  You must provide a query object.`
      err_out.status = 400
      throw err_out
    }
    return collection
  }
  async find(query, collection) {
    try {
      //need to determine what collection (projects, groups, userPerferences) this goes into.
      collection ??= this.validateAndDetermineCollection(query)
      let result = await this.db.collection(collection).find(query).toArray()
      return result
    } catch (err) {
      // Specifically account for unexpected mongo things.
      if (!err?.message) err.message = err.toString()
      if (!err?.status) err.status = 500
      if (!err?._dbaction) err._dbaction = "find"
      throw err
    }
  }

  async findOne(query, collection) {
    try {
      //need to determine what collection (projects, groups, userPerferences) this goes into.
      collection ??= this.validateAndDetermineCollection(query)
      let result = await this.db.collection(collection).findOne(query)
      return result
    } catch (err) {
      // Specifically account for unexpected mongo things.
      if (!err?.message) err.message = err.toString()
      if (!err?.status) err.status = 500
      if (!err?._dbaction) err._dbaction = "findOne"
      throw err
    }
  }

  /**
   * Insert a document into the database (mongo)
   * @param data JSON from an HTTP POST request
   * @return The inserted document JSON or error JSON
   */
  async save(data, collection) {
    err_out._dbaction = "insertOne"
    try {
      //need to determine what collection (projects, groups, users) this goes into.
      const data_type = this.determineDataType(data, collection)
      collection ??= discernCollectionFromType(data_type)
      if (!collection) {
        err_out.message = `Cannot figure which collection for object of type '${data_type}'`
        err_out.status = 400
        throw err_out
      }
      data._id ??= this.reserveId()
      const result = await this.db.collection(collection).insertOne(data)
      if (result.insertedId) {
        return data
      }
      err_out.message = `Document was not inserted into the database.`
      err_out.status = 500
      throw err_out
    } catch (err) {
      // Specifically account for unexpected mongo things.
      if (!err?.message) err.message = err.toString()
      if (!err?.status) err.status = 500
      if (!err?._dbaction) err._dbaction = "insertOne"
      throw err
    }
  }

  /**
   * Update an existing object in the database (mongo)
   * @param data JSON from an HTTP POST request.  It must contain an id.
   * @return The inserted document JSON or error JSON
   */
  async update(data) {
    // Note this may be an alias for save()
    err_out._dbaction = "replaceOne"
    try {
      //need to determine what collection (projects, groups, userPerferences) this goes into.
      const data_type = data["@type"] ?? data.type
      let data_id = data["@id"] ?? data._id
      if (!data_id) {
        err_out.message = `An 'id' must be present to update.`
        err_out.status = 400
        throw err_out
      }
      if (!data_type) {
        err_out.message = `Cannot find 'type' on this data, and so cannot figure out a collection for it.`
        err_out.status = 400
        throw err_out
      }
      const collection = discernCollectionFromType(data_type)
      if (!collection) {
        err_out.message = `Cannot figure which collection for object of type '${data_type}'`
        err_out.status = 400
        throw err_out
      }
      const obj_id = data_id.split("/").pop()
      const filter = {_id: data_id}
      const result = await this.db
        .collection(collection)
        .replaceOne(filter, data)
      if (result?.matchedCount === 0) {
        err_out.message = `id '${obj_id}' Not Found`
        err_out.status = 404
        throw err_out
      }
      if (result?.modifiedCount >= 0) {
        return data
      } else {
        err_out.message = "Document was not updated in the database."
        err_out.status = 500
        throw err_out
      }
    } catch (err) {
      // Specifically account for unexpected mongo things.
      if (!err?.message) err.message = err.toString()
      if (!err?.status) err.status = 500
      if (!err?._dbaction) err._dbaction = "replaceOne"
      throw err
    }
  }

  /**
   * Make an existing object in the database be gone from the normal flow of things (mongo)
   * @param data JSON from an HTTP DELETE request.  It must contain an id.
   * @return The delete result JSON or error JSON
   */
  async remove(id) {
    err_out._dbaction = "deleteOne"
    err_out.message = "Not yet implemented.  Stay tuned."
    err_out.status = 501
    throw err_out
  }

  /**
   * Get by ID.  We need to decide about '@id', 'id', '_id', and http/s
   */
  async getById(_id, collection) {
    return this.findOne({_id}, collection)
  }

  determineDataType(data,override) {
    const data_type = data["@type"] ?? data.type ?? override
    if (!data_type) {
      const err_out = {
        message: `Cannot find 'type' on this data, and so cannot figure out a collection for it.`,
        status: 400,
        _dbaction: "insertOne"
      }
      throw err_out
    }
     return data_type
  }
}

export default DatabaseController
