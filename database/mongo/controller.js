/**
 * A MongoDB Controller. Actions here specifically interact with the set MongoDB Database.
 * @see env.MONGODB
 *
 * @author Bryan Haberberger
 * https://github.com/thehabes
 */

import { MongoClient, ObjectId } from "mongodb"
import dotenv from "dotenv"

let storedEnv = dotenv.config()
let err_out = Object.assign(new Error(), {
  status: 123,
  message: "N/A",
  _dbaction: "N/A"
})

// Singleton MongoClient and DB
let sharedClient = null
let sharedDb = null

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
    if (!sharedClient) {
      sharedClient = new MongoClient(process.env.MONGODB)
      await sharedClient.connect()
      sharedDb = sharedClient.db(process.env.MONGODBNAME)
      console.log("MongoDB Connection Successful")
      console.log(process.env.MONGODB)
    }
    this.client = sharedClient
    this.db = sharedDb
    return
  }

  /**
   * Determine if the provided chars are a valid local MongoDB ObjectID().
   * @param id the string to check
   * @return boolean
   */
  static isValidId(id) {
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
    if (sharedClient) {
      await sharedClient.close()
      sharedClient = null
      sharedDb = null
      console.log("Mongo controller client has been closed")
    }
    return
  }

  /**
   * Generate an new mongo _id as a hex string (as opposed _id object, for example)
   * @return A hex string or error
   * */
  reserveId(seed) {
    try {
      return ObjectId.generate(seed).toHexString()
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
      let result = await this.db.command({ ping: 1 }).catch((_err) => {
        return false
      })
      result = result.ok ? true : false
      return result
    } catch (err) {
      console.error(err)
      return false
    }
  }

  async find(query, collection) {
    try {
      // Not allowed to find null or {}
      if (!query || Object.keys(query).length === 0) {
        err_out.message = `Empty or null query detected. You must provide a query object.`
        err_out.status = 400
        throw err_out
      }

      if (!collection) {
        err_out.message = `Collection is required for find operation`
        err_out.status = 400
        throw err_out
      }

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
      // Not allowed to find null or {}
      if (!query || Object.keys(query).length === 0) {
        err_out.message = `Empty or null query detected. You must provide a query object.`
        err_out.status = 400
        throw err_out
      }

      if (!collection) {
        err_out.message = `Collection is required for findOne operation`
        err_out.status = 400
        throw err_out
      }

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
    try {
      if (!collection) {
        err_out.message = `Collection is required for save operation`
        err_out.status = 400
        throw err_out
      }

      data._id ??= this.reserveId()
      const result = await this.db.collection(collection).insertOne(data)

      if (result.insertedId) {
        return data
      }

      err_out.message = `Document was not inserted into the database`
      err_out.status = 500
      throw err_out
    } catch (err) {
      // Specifically account for unexpected mongo things
      if (!err?.message) err.message = err.toString()
      if (!err?.status) err.status = 500
      if (!err?._dbaction) err._dbaction = "insertOne"
      throw err
    }
  }

  /**
   * Update an existing object in the database (mongo)
   * @param data JSON from an HTTP POST request. It must contain an id.
   * @return The inserted document JSON or error JSON
   */
  async update(data, collection) {
    try {
      let data_id = data["@id"] ?? data._id
      if (!data_id) {
        err_out.message = `An 'id' must be present to update`
        err_out.status = 400
        throw err_out
      }

      if (!collection) {
        err_out.message = `Collection is required for update operation.`
        err_out.status = 400
        throw err_out
      }

      const obj_id = data_id.split("/").pop()
      const filter = { _id: data_id }
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
   * @param data JSON from an HTTP DELETE request. It must contain an id.
   * @return The delete result JSON or error JSON
   */
  async remove(id, collection) {
    try {
      if (!collection) {
        err_out.message = `Collection is required for remove operation.`
        err_out.status = 400
        throw err_out
      }

      const obj_id = id.split("/").pop()
      const filter = { _id: obj_id }
      const result = await this.db.collection(collection).deleteOne(filter)

      if (result?.deletedCount === 0) {
        err_out.message = `id '${obj_id}' Not Found`
        err_out.status = 404
        throw err_out
      }

      return result
    } catch (err) {
      // Specifically account for unexpected mongo things.
      if (!err?.message) err.message = err.toString()
      if (!err?.status) err.status = 500
      if (!err?._dbaction) err._dbaction = "deleteOne"
      throw err
    }
  }

  /**
   * Get by ID. We need to decide about '@id', 'id', '_id', and http/s
   */
  async getById(_id, collection) {
    return this.findOne({ _id }, collection)
  }
}

export default DatabaseController
