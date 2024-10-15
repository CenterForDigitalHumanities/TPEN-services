import dbDriver from "../../database/driver.mjs"
const database = new dbDriver("mongo")

export default class Group {
    constructor(groupId) {
        this._id = groupId
        this.members = { roles: [] }
    }

    async #loadFromDB() {
        return database.getById(this._id, "Group")
    }

    async getMembers() {
        // if this members is an empty object, load from db
        if (Object.keys(this.members).length === 0) {
            return this.#loadFromDB()
        }
        return this.members
    }

    addMember(memberId, roles) {
        if (this.members[memberId]) {
            throw {
                status: 400,
                message: "Member already exists"
            }
        }
        this.members[memberId] = {}
        this.updateMember(memberId, roles)
    }

    updateMember(memberId, roles) {
        if (!this.members[memberId]) {
            throw {
                status: 404,
                message: "Member not found"
            }
        }
        if(!Array.isArray(roles)) {
            if(typeof roles !== "string") {
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
        if(!Array.isArray(roles)) {
            if(typeof roles !== "string") {
                throw {
                    status: 400,
                    message: "Invalid roles"
                }
            roles = roles.split(" ")
            }
        }
        this.members[memberId].roles = [...new Set([this.members[memberId].roles.concat(roles)])]        
    }

    removeMemberRoles(memberId, roles) {
        if (!this.members[memberId]) {
            throw {
                status: 404,
                message: "Member not found"
            }
        }
        if(!Array.isArray(roles)) {
            if(typeof roles !== "string") {
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
        return database.save(this,process.env.TPENGROUPS)
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
        if(!newGroup.getByRole("OWNER")?.length) {
            newGroup[newGroup.members[creator] ? "addMemberRoles" : "addMember"](creator, "OWNER")
        }
        if(!newGroup.getByRole("LEADER")?.length) {
            newGroup[newGroup.members[creator] ? "addMemberRoles" : "addMember"](creator, "LEADER")
        }
        return newGroup.save()
    }
}
