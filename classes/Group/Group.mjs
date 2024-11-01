import dbDriver from "../../database/driver.mjs"
const database = new dbDriver("mongo")

export default class Group {
    constructor(_id = database.reserveId()) {
        this._id = _id
        this.data = { _id }
        this.data.members = {}
    }

    async #loadFromDB() {
        this.data = await database.getById(this._id, "groups")
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

    addMember(memberId, roles) {
        if (this.data.members[memberId]) {
            const err = new Error("Member already exists")
            err.status = 400
            throw err
        }
        this.data.members[memberId] = { roles: [] }
        this.updateMember(memberId, roles)
    }

    async updateMember(memberId, roles) {
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
            roles = roles.toUpperCase().split(" ")
        }
        this.data.members[memberId].roles = roles
        await this.update()
    }

    async addMemberRoles(memberId, roles) {

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
            roles = roles.toUpperCase().split(" ")
        }
        this.data.members[memberId].roles = [...new Set([...this.data.members[memberId].roles, ...roles])]
    }

    async removeMemberRoles(memberId, roles) {
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
            roles = roles.toUpperCase().split(" ")
        }
        this.data.members[memberId].roles = this.data.members[memberId].roles.filter(role => !roles.includes(role))
        await this.update()
    }

    removeMember(memberId) {
        delete this.data.members[memberId]
    }

    getByRole(role) {
        return this.data.members && Object.keys(this.data.members).filter(memberId => this.data.members[memberId].roles.includes(role))
    }

    async save() {
        return database.save(this.data, process.env.TPENGROUPS)
    }

    async update() {
        return database.update({ ...this.data, "@type": "Group" })
    }

    static async createNewGroup(creator, payload) {
        const { customRoles, label, members } = payload
        if (!creator) {
            throw {
                status: 400,
                message: "Owner ID is required"
            }
        }
        const newGroup = new Group()
        Object.assign(newGroup.data, Object.fromEntries(
            Object.entries({ creator, customRoles, label, members }).filter(([_, v]) => v != null)
        ))
        if (!newGroup.getByRole("OWNER")?.length) {
            newGroup[newGroup.data.members[creator] ? "addMemberRoles" : "addMember"](creator, "OWNER")
        }
        if (!newGroup.getByRole("LEADER")?.length) {
            newGroup[newGroup.data.members[creator] ? "addMemberRoles" : "addMember"](creator, "LEADER")
        }
        return newGroup.save()
    }

    static defaultRoles = {
        OWNER: ["*_*_*"],
        LEADER: ["UPDATE_*_PROJECT", "READ_*_PROJECT", "*_*_MEMBER", "*_*_ROLE", "*_*_PERMISSION", "*_*_LAYER", "*_*_PAGE"],
        CONTRIBUTOR: ["READ_*_MEMBER", "UPDATE_TEXT_*", "UPDATE_ORDER_*", "UPDATE_SELECTOR_*", "CREATE_SELECTOR_*", "DELETE_*_LINE", "UPDATE_DESCRIPTION_LAYER", "CREATE_*_LAYER"],
        VIEWER: ["READ_*_PROJECT", "READ_*_MEMBER", "READ_*_LAYER", "READ_*_PAGE", "READ_*_LINE"]
    }
}
