import dbDriver from "../../database/driver.mjs"
const database = new dbDriver("mongo")

export default class Group {
    constructor(groupId) {
        this._id = groupId
        this.members = {}
    }

    async #loadFromDB() {
        return database.getById(this._id, "groups")
    }

    async getMembers() {
        // if this members is an empty object, load from db
        if (Object.keys(this.members).length === 0) {
            await this.#loadFromDB()
        }
        return this.members
    }

    /**
     * Generate a ROLE:PERMISSIONS map for the indicated member.
     * @param {String} memberId hexstring id of the member
     * @returns Object
     */
    async getMemberRoles(memberId) {
        if (!this.members) {
            await this.#loadFromDB()
        }
        if (!this.members[memberId]) {
            const err = new Error("Member not found")
            err.status = 404
            throw err
        }
        const roles = this.members[memberId]?.roles
        const allRoles = Object.assign(Group.defaultRoles, this.customRoles)
        return Object.fromEntries(roles.map(role => [role, allRoles[role]]))
    }

    getPermissions(role) {
        return Object.assign(Group.defaultRoles, this.customRoles)[role] ?? "x_x_x"
    }

    addMember(memberId, roles) {
        if (this.members[memberId]) {
            const err = new Error("Member already exists")
            err.status = 400
            throw err
        }
        this.members[memberId] = { roles: [] }
        this.updateMember(memberId, roles)
    }

    updateMember(memberId, roles) {
        if (!this.members[memberId]) {
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
        this.members[memberId].roles = roles
    }

    addMemberRoles(memberId, roles) {
        if (!this.members[memberId]) {
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
        this.members[memberId].roles = [...new Set([...this.members[memberId].roles, ...roles])]
    }

    removeMemberRoles(memberId, roles) {
        if (!this.members[memberId]) {
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
                roles = roles.split(" ")
            }
        }
        this.members[memberId].roles = this.members[memberId].roles.filter(role => !roles.includes(role))
    }

    removeMember(memberId) {
        delete this.members[memberId]
    }

    getByRole(role) {
        return this.members && Object.keys(this.members).filter(memberId => this.members[memberId].roles.includes(role))
    }

    async save() {
        return database.save(this, process.env.TPENGROUPS)
    }

    static async createNewGroup(creator, payload) {
        const { customRoles, label, members } = payload
        if (!creator) {
            throw {
                status: 400,
                message: "Owner ID is required"
            }
        }
        const newGroup = new Group(database.reserveId())
        Object.assign(newGroup, Object.fromEntries(
            Object.entries({ creator, customRoles, label, members }).filter(([_, v]) => v != null)
        ))
        if (!newGroup.getByRole("OWNER")?.length) {
            newGroup[newGroup.members[creator] ? "addMemberRoles" : "addMember"](creator, "OWNER")
        }
        if (!newGroup.getByRole("LEADER")?.length) {
            newGroup[newGroup.members[creator] ? "addMemberRoles" : "addMember"](creator, "LEADER")
        }
        return newGroup.save()
    }

    static defaultRoles = {
        OWNER: ["*_*_*"],
        LEADER: ["UPDATE_*_PROJECT", "*_*_MEMBER", "*_*_ROLE", "*_*_PERMISSION", "*_*_LAYER", "*_*_PAGE"],
        CONTRIBUTOR: ["READ_*_MEMBER", "UPDATE_TEXT_*", "UPDATE_ORDER_*", "UPDATE_SELECTOR_*", "CREATE_SELECTOR_*", "DELETE_*_LINE", "UPDATE_DESCRIPTION_LAYER", "CREATE_*_LAYER"],
        VIEWER: ["READ_*_PROJECT", "READ_*_MEMBER", "READ_*_LAYER", "READ_*_PAGE", "READ_*_LINE"]
    }
}
