import { MongoClient } from 'mongodb'

class DatabaseController {
    constructor(uri) {
        this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    }

    async connect() {
        await this.client.connect()
        this.db = this.client.db()
    }

    async close() {
        await this.client.close()
    }

    async create(collection, document) {
        const result = await this.db.collection(collection).insertOne(document)
        return result
    }

    async read(collection, query) {
        const result = await this.db.collection(collection).findOne(query)
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
        return this.update('userPreferences', { userId }, preferences)
    }
}

export default DatabaseController
