import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
let storedEnv = dotenv.config()
dotenvExpand.expand(storedEnv)

/** Other modules do not directly interact with this client.  They do things like createProject() which uses the DatabaseCRUD below  */
const client = new MongoClient(process.env.MONGODB)
const db = client.db(process.env.MONGODBNAME)

/** Other modules do not connect or close */
async function connect() {
    try {
        await client.connect()
        console.log("MongoDB Connection Successful")
        console.log(process.env.MONGODB)
      } 
      catch (err) {
        console.log("MongoDB Connection Failed")
        console.log(process.env.MONGODB)
        console.error(err)
        throw err
      } 
}

/** Other modules do not connect or close */
async function close() {
    await client.close()
}

connect().catch(console.dir)

export function newID() {
    return new ObjectId().toHexString()
}

export async function connected() {
    // Send a ping to confirm a successful connection
    await db.collection(process.env.TPENPROJECTS).command({ ping: 1 }).catch(err => {return false})
    return true
}

export async function create(collection, data) {
    console.log("MONGODB CREATING...")
    const result = await db.collection(collection).insertOne(data)
    console.log(result)
    data["@id"] = process.env.SERVERURL+"created/"+result.insertedId
    return data
}

export async function update(collection, query, update) {
    const result = await db.collection(collection).updateOne(query, { $set: update })
    return result
}

export async function remove(collection, id) {
    const result = await db.collection(collection).deleteOne(query, { $set: update })
    return result
}

/**
 * Get by ID.  We need to decide about '@id', 'id', '_id', and http/s 
 */ 
export async function getByID(collection, id) {
    const result = await db.collection(collection).findOne({"_id":id})
    return result
}

/**
 * Get by property matches and return all objects that match
 */ 
export async function query(collection, params={"bryan_says_you_will_find":"nothing"}){
    const results = await db.collection(collection).find(params)
    return results
}

/** 
 * THESE BELONG SOMEWHERE ELSE
 */ 

// Project methods
// async createProject(project) {
//     console.log("CREATE PROJECT")
//     const data = await this.create('projects', project)
//     console.log(data)
//     return data
// }

// async assignToolToProject(projectId, tool) {
//     return this.update('projects', { _id: projectId }, { tool })
// }

// async grantGroupAccessToProject(projectId, groupId) {
//     return this.update('projects', { _id: projectId }, { groupId })
// }

// // Group methods
// async addUserToGroup(groupId, userId) {
//     return this.update('groups', { _id: groupId }, { $push: { users: userId } })
// }

// async removeUserFromGroup(groupId, userId) {
//     return this.update('groups', { _id: groupId }, { $pull: { users: userId } })
// }

// async modifyUserRoles(groupId, userId, role) {
//     return this.update('groups', { _id: groupId, 'users.userId': userId }, { 'users.$.role': role })
// }

// // UserPreferences methods
// async updateUserPreferences(userId, preferences) {
//     return this.update('userPreferences', { _id: userId }, preferences)
// }