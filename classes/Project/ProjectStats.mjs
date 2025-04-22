// classes/Project/ProjectStats.mjs
import dbDriver from "../../database/driver.mjs"

const database = new dbDriver("mongo")
const STATS_COLL =  process.env.TPEN_USER_PROJECT_STATS

export default class ProjectStats {
    /**
     * Record that `userId` just opened `projectId`.
     * If a stat exists, update its lastOpened; otherwise insert a new one.
     */
    static async recordOpen(userId, projectId) {
        const query = { userId, projectId }
        const now = new Date()

        // see if there's already a stat doc
        const existing = await database.findOne(query, STATS_COLL)

        if (existing) {
            existing.lastOpened = now
            // update by _id under the hood
            await database.update(existing, STATS_COLL)
            return existing
        } else {
            const stat = { userId, projectId, lastOpened: now }
            await database.save(stat, STATS_COLL)
            return stat
        }
    }

    /**
     * Fetch up to `limit` stats for this user, sorted by lastOpened descending.
     * We pull all then sort/limit in memory.
     */
    static async getLastOpened(userId, limit = 1) {
        const stats = await database.find({ userId }, STATS_COLL)
        // sort descending by lastOpened timestamp
        stats.sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened))
        return stats.slice(0, limit)
    }
}
