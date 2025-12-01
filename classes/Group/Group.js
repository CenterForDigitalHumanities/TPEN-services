import dbDriver from "../../database/driver.js"
import User from "../User/User.js"
const database = new dbDriver("mongo")

export default class Group {
    constructor(_id = database.reserveId()) {
        this._id = _id
        this.data = { _id }
        this.data.members = {}
    }

    async #loadFromDB() {
        this.data = await database.getById(this._id, process.env.TPENGROUPS)
        return this
    }

    async getMembers() {
        // if this members is an empty object, load from db
        if (Object.keys(this.data.members).length === 0) {
            await this.#loadFromDB()
        }
        return this.data.members
    }

    /**
     * Generate a ROLE:PERMISSIONS map for the indicated member.
     * @param {String} memberId hexstring id of the member
     * @returns Object
     */
    async getMemberRoles(memberId) {
        if (Object.keys(this.data.members).length === 0) {
            await this.#loadFromDB()
        }
        if (!this.data.members[memberId]) {
            const err = new Error("Member not found")
            err.status = 404
            throw err
        }
        const roles = this.data.members[memberId]?.roles
        const allRoles = { ...Group.defaultRoles, ...this.data.customRoles }
        return Object.fromEntries(roles.map(role => [role, allRoles[role]]))
    }

    async getCustomRoles() {
        if (Object.keys(this.data.members).length === 0) {
            await this.#loadFromDB()
        }
        return this.data.customRoles
    }

    getPermissions(role) {
        return Object.assign(Group.defaultRoles, this.data.customRoles)[role] ?? "x_x_x"
    }

    async addMember(memberId, roles) {
        if (!Object.keys(this.data.members).length) {
            await this.#loadFromDB()
        }
        if (this.data.members[memberId]) {
            const err = new Error("Member already exists")
            err.status = 400
            throw err
        }
        this.data.members[memberId] = { roles: [] }
        await this.setMemberRoles(memberId, roles)
    }

    /**
     * Replace all roles for a member with the provided roles.
     * @param {String} memberId _id of the member
     * @param {Array | String} roles [ROLE, ROLE, ...] or "ROLE ROLE ..."
     */
    async setMemberRoles(memberId, roles) {
        if (!Object.keys(this.data.members).length) {
            await this.#loadFromDB()
        }

        if (!this.data.members[memberId]) {
            throw {
                status: 404,
                message: "Member not found"
            }
        }
        if (!Array.isArray(roles)) {
            if (typeof roles !== "string") {
                throw {
                    status: 400,
                    message: "Invalid roles"
                }
            }
            roles = roles.split(" ")
        }

        roles = washRoles(roles)
        this.data.members[memberId].roles = roles
        await this.update()
    }

    /**
     * Add if not in roles for a member with the provided roles.
     * @param {String} memberId _id of the member
     * @param {Array | String} roles [ROLE, ROLE, ...] or "ROLE ROLE ..."
     */
    async addMemberRoles(memberId, roles, allowOwner = false) {

        if (!Object.keys(this.data.members).length) {
            await this.#loadFromDB()
        }
        if (!this.data.members[memberId]) {
            throw {
                status: 404,
                message: "Member not found"
            }
        }
        if (!Array.isArray(roles)) {
            if (typeof roles !== "string") {
                throw {
                    status: 400,
                    message: "Invalid roles"
                }
            }
            roles = roles.split(" ")
        }
        roles = washRoles(roles, allowOwner)
        this.data.members[memberId].roles = [...new Set([...this.data.members[memberId].roles, ...roles])]
        // If we need the group to update first (caused error)
        // await this.update()
    }

    /**
     * Remove roles if found for a member.
     * @param {String} memberId _id of the member
     * @param {Array | String} roles [ROLE, ROLE, ...] or "ROLE ROLE ..."
     */
    async removeMemberRoles(memberId, roles, allowOwner = false) {
        if (!Object.keys(this.data.members).length) {
            await this.#loadFromDB()
        }
        if (!this.data.members[memberId]) {
            throw {
                status: 404,
                message: "Member not found"
            }
        }
        if (!Array.isArray(roles)) {
            if (typeof roles !== "string") {
                throw {
                    status: 400,
                    message: "Invalid roles"
                }
            }
            roles = roles.split(" ")
        }
        roles = washRoles(roles, allowOwner)
        const currentRoles = this.data.members[memberId].roles
        if (currentRoles.length <= 1 && roles.includes(currentRoles[0])) {
            throw {
                status: 400,
                message: "Cannot remove the last role; each member must have at least one role."
            }
        }

        this.data.members[memberId].roles = this.data.members[memberId].roles.filter(role => !roles.includes(role))
        await this.update()
    }

    /**
     *  Remove a member from a Group.
     *  A member can be removed by an admin or by themselves.
     *  Validations:
     *    - User must be a member of the project
     *    - Cannot remove the only OWNER (must transfer ownership first)
     *
     * @param {string} memberId The User/member _id to remove from the Group and perhaps delete from the db.
     * @param {boolean} voluntary Whether the user is leaving voluntarily (true) or being removed by admin (false).
    */
    async removeMember(memberId, voluntary = false) {
        if (!Object.keys(this.data.members).length) {
            await this.#loadFromDB()
        }
        const member = this.data.members[memberId]
        if (!member) {
            throw {
              status: 400,
              message: "User is not a member of this group"
            }
        }
        const userRoles = member.roles
        // Prevent removing the only OWNER
        if (userRoles.includes("OWNER")) {
            const owners = this.getByRole("OWNER")
            if (owners.length === 1) {
                throw {
                    status: 403,
                    message: "Cannot remove: This user is the only owner. Transfer ownership first."
                }
            }
        }
        delete this.data.members[memberId]
        // If we need the Group to update in the db in addition to the Class data.
        // await this.update()
    }

    /**
     * Transfer membership from one user to another.
     * Copies all roles from sourceMemberId to targetMemberId and removes sourceMemberId.
     * If targetMemberId already exists, roles are merged (union).
     * @param {String} sourceMemberId - The member being replaced (e.g., temp user)
     * @param {String} targetMemberId - The member receiving the membership (e.g., real user)
     */
    async transferMembership(sourceMemberId, targetMemberId) {
        if (!Object.keys(this.data.members).length) {
            await this.#loadFromDB()
        }

        const sourceRoles = this.data.members[sourceMemberId]?.roles || []
        if (!sourceRoles.length) return

        if (this.data.members[targetMemberId]) {
            // Merge roles if target already exists
            this.data.members[targetMemberId].roles = [
                ...new Set([...this.data.members[targetMemberId].roles, ...sourceRoles])
            ]
        } else {
            // Add target with source's roles
            this.data.members[targetMemberId] = { roles: [...sourceRoles] }
        }

        delete this.data.members[sourceMemberId]
        await this.update()
    }

    getByRole(role) {
        return this.data.members && Object.keys(this.data.members).filter(memberId => this.data.members[memberId].roles.includes(role))
    }

    isValidRolesMap(roleMap) {
        if (Array.isArray(roleMap)) {
            return roleMap.every(this.isValidRolesMap)
        }
        if (typeof roleMap !== "object") {
            return false
        }
        let permissions = Object.values(roleMap).flat()
        permissions = permissions.map(permission => permission?.split(" "))
        if (permissions.some(permission => !Array.isArray(permission))) {
            return false
        }
        return true
    }

    async updateCustomRoles(roles) {
        if (!Object.keys(this.data.members).length) {
            await this.#loadFromDB()
        }
        if (!this.isValidRolesMap(roles))
            throw new Error("Invalid roles. Must be a JSON Object with keys as roles and values as arrays of permissions or space-delimited strings.")
        this.data.customRoles = roles
        await this.update()
    }

    async addCustomRoles(roleMap) {
        if (!Object.keys(this.data.members).length) {
            await this.#loadFromDB()
        }
        if (!this.isValidRolesMap(roleMap))
            throw new Error("Invalid roles. Must be a JSON Object with keys as roles and values as arrays of permissions or space-delimited strings.")
        this.data.customRoles = { ...this.data.customRoles, ...roleMap }
        await this.update()
    }

    async removeCustomRoles(roleName) {
        if (!Object.keys(this.data.members).length) {
            await this.#loadFromDB()
        }

        delete this.data.customRoles[roleName]
        await this.update()
    }

    async save() {
        await this.validateGroup()
        return database.save(this.data, process.env.TPENGROUPS)
    }

    async update() {
        await this.validateGroup()
        return database.update(this.data, process.env.TPENGROUPS)
    }

    async validateGroup() {
        if (!this.data.creator) {
            throw {
                status: 400,
                message: "Owner ID is required"
            }
        }
        //remove members with empty or invalid roles
        for (const memberId in this.data.members) {
            if (!this.data.members[memberId].roles || !Array.isArray(this.data.members[memberId].roles)) {
                delete this.data.members[memberId]
            }
        }
        this.data.customRoles ??= {}
        if (!this.isValidRolesMap(this.data.customRoles)) {
            throw {
                status: 400,
                message: "Invalid roles. Must be a JSON Object with keys as roles and values as arrays of permissions or space-delimited strings."
            }
        }

        if (!this.getByRole("OWNER")?.length) {
            await this.addMemberRoles(this.data.creator, "OWNER", true)
        }
        if (!this.getByRole("LEADER")?.length) {
            await this.addMemberRoles(this.data.creator, "LEADER")
        }
    }

    static async createNewGroup(creator, payload) {
        const { customRoles, label, members } = payload
        const newGroup = new Group()
        Object.assign(newGroup.data, Object.fromEntries(
            Object.entries({ creator, customRoles, label, members }).filter(([_, v]) => v != null)
        ))
        await newGroup.validateGroup()
        return await newGroup.save()
    }

    /**
     * Find all groups containing a specific member.
     * @param {String} memberId - The _id of the member to search for
     * @returns {Promise<Array>} - Array of group documents containing this member
     */
    static async getGroupsByMember(memberId) {
        return database.find(
            { [`members.${memberId}`]: { $exists: true } },
            process.env.TPENGROUPS
        )
    }

    static defaultRoles = {
        OWNER: ["*_*_*"],
        LEADER: ["UPDATE_*_PROJECT", "READ_*_PROJECT", "*_*_MEMBER", "*_*_ROLE", "*_*_PERMISSION", "*_*_LAYER", "*_*_PAGE"],
        CONTRIBUTOR: ["READ_*_*", "UPDATE_TEXT_*", "UPDATE_ORDER_*", "UPDATE_SELECTOR_*", "CREATE_SELECTOR_*", "DELETE_*_LINE", "UPDATE_DESCRIPTION_LAYER", "CREATE_*_LAYER"],
        VIEWER: ["READ_*_PROJECT", "READ_*_MEMBER", "READ_*_LAYER", "READ_*_PAGE", "READ_*_LINE"]
    }
}

function washRoles(roles, allowOwner = false) {
    return roles.map(role => {
        if (typeof role !== "string") {
            throw {
                status: 400,
                message: "Invalid role:" + role
            }
        }
        const upperRole = role.toUpperCase()
        if (!allowOwner && upperRole === "OWNER") {
            throw {
                status: 400,
                message: "Cannot assign OWNER role"
            }
        }
        return upperRole
    })
}
