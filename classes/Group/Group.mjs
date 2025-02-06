import dbDriver from "../../database/driver.mjs"
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
        const allRoles = Object.assign(Group.defaultRoles, this.data.customRoles)
        return Object.fromEntries(roles.map(role => [role, allRoles[role]]))
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
        this.setMemberRoles(memberId, roles)
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

        washRoles(roles)
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
        washRoles(roles, allowOwner)
        this.data.members[memberId].roles = [...new Set([...this.data.members[memberId].roles, ...roles])]
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
        washRoles(roles, allowOwner)
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

    async removeMember(memberId) {
        if (!Object.keys(this.data.members).length) {
            await this.#loadFromDB()
        }
        delete this.data.members[memberId]
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

    async setCustomRoles(roles) {
        if (!Object.keys(this.data.members).length) {
            await this.#loadFromDB()
        }
        if (!this.isValidRolesMap(roles))
            throw new Error("Invalid roles. Must be a JSON Object with keys as roles and values as arrays of permissions or space-delimited strings.")
        this.data.customRoles = roles
        this.update()
    }

    async addCustomRoles(roleMap) {
        if (!Object.keys(this.data.members).length) {
            await this.#loadFromDB()
        }
        if (!this.isValidRolesMap(roleMap))
            throw new Error("Invalid roles. Must be a JSON Object with keys as roles and values as arrays of permissions or space-delimited strings.")
        this.data.customRoles = { ...this.data.customRoles, ...roleMap }
        this.update()
    }

    async removeCustomRoles(roleMap) {
        if (!Object.keys(this.data.members).length) {
            await this.#loadFromDB()
        }

        if (!Array.isArray(roleMap)) {

            if (this.isValidRolesMap(roleMap)) {
                for (const role in roleMap) {
                    delete this.data.customRoles[role]
                }
                return this.update()
            }
            if (typeof roleMap !== "string") {
                throw {
                    status: 400,
                    message: "Invalid roles. Must be an array of strings or a JSON Object with keys as roles and values as arrays of permissions or space-delimited strings."
                }
            }
            roleMap = roleMap.toUpperCase().split(" ")

        }

        roleMap.map(role => delete this.data.customRoles[role])
        return this.update()
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
        console.log("from validateGroup", this.data)
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
        role.toUpperCase()
        if (!allowOwner && role === "OWNER") {
            throw {
                status: 400,
                message: "Cannot assign OWNER role"
            }
        }
    })
}
