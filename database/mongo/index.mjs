import { MongoClient, ObjectId } from 'mongodb'


class DatabaseController{

    constructor(connect=false) {
        // try to establish the client and connect
        if(connect) await this.connect()
    }
    
    /** Other modules do not connect or close */
    async function connect() {
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

    /** Other modules do not connect or close */
    async close() {
        await this.client.close()
    }


    newID() {
        return new ObjectId().toHexString()
    }

    async connected() {
        // Send a ping to confirm a successful connection
        await this.db.collection(process.env.TPENPROJECTS).command({ ping: 1 }).catch(err => {return false})
        return true
    }

    async create(collection, data) {
        console.log("MONGODB CREATING...")
        const result = await this.db.collection(collection).insertOne(data)
        console.log(result)
        data["@id"] = process.env.SERVERURL+"created/"+result.insertedId
        return data
    }

    async update(collection, query, update) {
        const result = await this.db.collection(collection).updateOne(query, { $set: update })
        return result
    }

    async remove(collection, id) {
        const result = await this.db.collection(collection).deleteOne(query, { $set: update })
        return result
    }

    /**
     * Get by ID.  We need to decide about '@id', 'id', '_id', and http/s 
     */ 
    async getByID(collection, id) {
        const result = await this.db.collection(collection).findOne({"_id":id})
        return result
    }

    /**
     * Get by property matches and return all objects that match
     */ 
    async query(collection, params={"bryan_says_you_will_find":"nothing"}){
        const results = await this.db.collection(collection).find(params)
        return results
    }    

}