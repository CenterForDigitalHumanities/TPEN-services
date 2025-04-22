import dbDriver from "../../database/driver.mjs"
import User from "../User/User.mjs"

const database = new dbDriver("mongo")
const PROJECT_COLL = process.env.TPENPROJECTS
const STATS_COLL = process.env.TPEN_USER_PROJECT_STATS

export default class ProjectStats {

    // upsert lastOpened 
    static async recordOpen(userId, projectId) {
        const now = new Date()
        const existing = await database.findOne({ userId }, STATS_COLL)
        if (existing) {
            existing.projectId = projectId
            existing.lastOpened = now
            return database.update(existing, STATS_COLL)
        }
        return database.save({ userId, projectId, lastOpened: now }, STATS_COLL)
    }

    // helper to get IDs of projects user can access
    static async _getAccessibleIds(userId) {
        const projects = await new User(userId).getProjects()
        return projects.map(project => project._id)
    }

    // newest by creation time
    static async getNewest(userId) {
        const ids = await this._getAccessibleIds(userId)
        const coll = database.controller.db.collection(PROJECT_COLL)
        const [doc] = await coll
            .find({ _id: { $in: ids } })
            .project({ _id: 1, label: 1 })
            .sort({ _createdAt: -1 })
            .limit(1)
            .toArray()
        return doc ?? null
    }

    // most recently modified
    static async getLastModified(userId) {
        const ids = await this._getAccessibleIds(userId)
        const coll = database.controller.db.collection(PROJECT_COLL)
        const [doc] = await coll
            .find({ _id: { $in: ids } })
            .project({ _id: 1, label: 1 })
            .sort({ _modifiedAt: -1 })
            .limit(1)
            .toArray()
        return doc ?? null
    }

    // last opened (single‐doc per user)
    static async getLastOpened(userId) {
        const stat = await database.findOne({ userId }, STATS_COLL)
        if (!stat) return null
        const coll = database.controller.db.collection(PROJECT_COLL)
        const [doc] = await coll
            .find({ _id: stat.projectId })
            .project({ _id: 1, label: 1 })
            .limit(1)
            .toArray()
        return doc ?? null
    }

    // bundle all three into one call
    static async getDashboard(userId) {
        const [newest, lastModified, lastOpened] = await Promise.all([
            this.getNewest(userId),
            this.getLastModified(userId),
            this.getLastOpened(userId)
        ])
        return { newest, lastModified, lastOpened }
    }
}
