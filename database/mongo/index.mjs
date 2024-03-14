import { MongoClient } from 'mongodb'

class DatabaseController {

    constructor(uri, name=process.env.MONGODBNAME) {
        this.client = new MongoClient(uri)
        this.db = this.client.db(name)
    }

    async connect() {
        try {
            this.conn = await this.client.connect()
            console.log("MongoDB Connection Estabsliehd")
            console.log(process.env.MONGODB)
            return this.conn
          } 
          catch (err) {
            this.conn = null
            console.log("MongoDB Connection Failed")
            console.log(process.env.MONGODB)
            console.error(err)
            throw err
          } 
    }

    async close() {
        await this.client.close()
    }

    async create(collection, data) {
        console.log("MONGODB CREATING...")
        const result = await this.db.collection(collection).insertOne(data)
        console.log(result)
        data["@id"] = process.env.SERVERULR+"/created/"+result.insertedId
        return data
    }

    async read(collection, id) {
        const result = await this.db.collection(collection).findOne(id)
        return result
    }

    async update(collection, query, update) {
        const result = await this.db.collection(collection).updateOne(query, { $set: update })
        return result
    }

    // Project methods
    async createProject(project) {
        return this.create('projects', project)
    }

    async assignToolToProject(projectId, tool) {
        return this.update('projects', { _id: projectId }, { tool })
    }

    async grantGroupAccessToProject(projectId, groupId) {
        return this.update('projects', { _id: projectId }, { groupId })
    }

    // Group methods
    async addUserToGroup(groupId, userId) {
        return this.update('groups', { _id: groupId }, { $push: { users: userId } })
    }

    async removeUserFromGroup(groupId, userId) {
        return this.update('groups', { _id: groupId }, { $pull: { users: userId } })
    }

    async modifyUserRoles(groupId, userId, role) {
        return this.update('groups', { _id: groupId, 'users.userId': userId }, { 'users.$.role': role })
    }

    // UserPreferences methods
    async updateUserPreferences(userId, preferences) {
        return this.update('userPreferences', { _id: userId }, preferences)
    }
}

export default DatabaseController
