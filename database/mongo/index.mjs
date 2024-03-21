import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
let storedEnv = dotenv.config()
dotenvExpand.expand(storedEnv)


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
 *    - UserPreferece
 * All other object types result in a "Bad Request"
 */ 
function discernCollectionFromType(data){
    const data_type = data["@type"] ?? data.type ?? null
    let collection = null
    if(!data_type) return collection
    switch(data_type){
        case "Project":
        case "Page":
            collection = process.env.TPENPROJECTS
        break
        case "Group":
        case "User":
            collection = process.env.TPENGROUPS
        break
        case "UserPreference":
            collection = process.env.TPENUSERPREFERENCES
        break
        default:
    }
    return collection
}

class DatabaseController{
    /**
     * Basic constructor.
     * @param connect A boolean for whether or not to attempt to open a connection to the mongo client immediately.
     */ 
    constructor(connect=false) {
        if(connect) this.connect()
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
          } 
          catch (err) {
            console.log("MongoDB Connection Failed")
            console.log(process.env.MONGODB)
            throw err
          } 
    }

    /** Close the connection with the mongo client */
    async close() {
        await this.client.close()
        console.log("Mongo controller client has been closed")
    }

    /** 
     * Generate an new mongo _id as a hex string (as opposed _id object, for example) 
     * @return A hex string or error
     * */
    newID() {
        try{
            return new ObjectId().toHexString()    
        }
        catch(err){
            return err
        }
    }

    /** 
     * Generally check that the controller has an active connection 
     * @return boolean
     * */
    async connected() {
        // Send a ping to confirm a successful connection
        try{
            console.log("connected ping")
            let result = await this.db.collection(process.env.TPENPROJECTS).command({ ping: 1 }).catch(err => {return false})
            result = result ? true : false
            return result    
        }
        catch(err){
            return false
        }
        
    }

    /**
     * Get by property matches and return all objects that match
     * @return JSON Array of matched documents or standard error object
     */ 
    async read(query){
        try{
            //need to determine what collection (projects, groups, userPerferences) this goes into.
            const data_type = query["@type"] ?? query.type ?? null
            if(!data_type) 
                return {"endpoint_error": "find", "status":400, "message":`Cannot find 'type' on this data, and so cannot figure out a collection for it.`}
            const collection = discernCollectionFromType(data_type)
            if(!collection) 
                return {"endpoint_error": "find", "status":400, "message":`Cannot figure which collection for object of type '${data_type}'`}
            if (Object.keys(query).length === 0) 
                return {"endpoint_error": "find", "status":400, "message":`Empty or null object detected.  You must provide a query object.`}
            let result = await this.db.collection(collection).find(query).toArray()
            return result
        }
        catch(err){
            return {"endpoint_error": "find", "status":500, "message":"There was an error querying the database."}
        }
    }    

    /**
     * Insert a document into the database (mongo)
     * @param data JSON from an HTTP POST request
     * @return The inserted document JSON or error JSON
     */ 
    async create(data) {
        try{
            //need to determine what collection (projects, groups, userPerferences) this goes into.
            const data_type = data["@type"] ?? data.type ?? null
            if(!data_type) 
                return {"endpoint_error": "insertOne", "status":400, "message":`Cannot find 'type' on this data, and so cannot figure out a collection for it.`}
            const collection = discernCollectionFromType(data_type)
            if(!collection) 
                return {"endpoint_error": "insertOne", "status":400, "message":`Cannot figure which collection for object of type '${data_type}'`}
            const result = await this.db.collection(collection).insertOne(data)
            console.log(result)
            if(result.insertedId){
                data["@id"] = process.env.SERVERURL+"created/"+result.insertedId
                return data    
            }
            else{
                return {"endpoint_error": "insertOne", "status":500, "message":"Document was not inserted into the database."}
            }
        }
        catch(err){
            return {"endpoint_error": "insertOne", "status":500, "message":"There was an error inserting the document into the database."}
        }
    }

    /**
     * Update an existing object in the database (mongo)
     * @param data JSON from an HTTP POST request.  It must contain an id.
     * @return The inserted document JSON or error JSON
     */ 
    async update(data) {
        try{
            //need to determine what collection (projects, groups, userPerferences) this goes into.
            const data_type = data["@type"] ?? data.type ?? null
            let data_id = data["@id"] ?? data._id ?? null
            let collection = null
            if(!data_id) 
                return {"endpoint_error": "updateOne", "status":400, "message":`Cannot find 'type' on this data, and so cannot figure out a collection for it.`}
            if(!data_type) 
                return {"endpoint_error": "updateOne", "status":400, "message":`Cannot find 'type' on this data, and so cannot figure out a collection for it.`}
            collection = discernCollectionFromType(data_type)
            if(!collection) 
                return {"endpoint_error": "updateOne", "status":500, "message":`Cannot figure which collection for object of type '${data_type}'`}
            const obj_id = data_id.split("/").pop()
            const filter = { "_id:": obj_id }
            const options = {}
            const updateDoc = { $set: update }
            const result = await this.db.collection(collection).updateOne(filter, updateDoc, options)
            console.log(result)
            if(result?.matchedCount === 0){
                return {"endpoint_error": "updateOne", "status":404, "message":`id '${obj_id}' Not Found`}  
            }
            if(result?.modifiedCount >= 0){
                return updateDoc
            }
            else{
                return {"endpoint_error": "updateOne", "status":500, "message":"Document was not updated in the database."}
            }
        }
        catch(err){
            return {"endpoint_error": "updateOne", "status":500, "message":"There was an error updating the document in the database."}
        }
    }

    /**
     * Update an existing object in the database (mongo)
     * @param data JSON from an HTTP DELETE request.  It must contain an id.
     * @return The delete result JSON or error JSON
     */ 
    async remove(data) {
        const data_type = data["@type"] ?? data.type ?? null
        let data_id = data["@id"] ?? data._id ?? null
        let collection = null
        if(!data_id) 
            return {"endpoint_error": "deleteOne", "status":400, "message":`Cannot find 'type' on this data, and so cannot figure out a collection for it.`}
        if(!data_type) 
            return {"endpoint_error": "deleteOne", "status":400, "message":`Cannot find 'type' on this data, and so cannot figure out a collection for it.`}
        collection = discernCollectionFromType(data_type)
        if(!collection) 
            return {"endpoint_error": "deleteOne", "status":500, "message":`Cannot figure which collection for object of type '${data_type}'`}
            
        const result = await this.db.collection(collection).deleteOne(query, { $set: update })
        if(result?.ok){
            return result
        }
        else{
            return {"endpoint_error": "updateOne", "status":500, "message":result.message}
        }
    }

    /**
     * Get by ID.  We need to decide about '@id', 'id', '_id', and http/s 
     */ 
    async getByID(id) {
        const result = await this.query({"_id":id})
        return result
    }

}

export default DatabaseController