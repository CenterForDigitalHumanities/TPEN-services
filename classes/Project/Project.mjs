import dbDriver from "../../database/driver.mjs"
import { sendMail } from "../../utilities/mailer/index.mjs"
import { validateProjectPayload } from "../../utilities/validatePayload.mjs"
import { User } from "../User/User.mjs"
import crypto from "crypto"
import Group from "../Group/Group.mjs"

const database = new dbDriver("mongo")

export default class Project {
  constructor(_id) {
    this._id = _id
    this.data = null
  }

  /**
   * @param {Project} payload
   */

  async create(payload) {
    // validation checks for all the required elements without which a project cannot be created. modify validateProjectPayload function to include more elements as they become available (layers,... )
    const validation = validateProjectPayload(payload)

    if (!validation.isValid) {
      throw { status: 400, message: validation.errors }
    }

    try {
      return database.save(payload, "projects")
    } catch (err) {
      throw {
        status: err.status || 500,
        message: err.message || "An error occurred while creating the project"
      }
    }
  }

  async delete(projectId) {
    if (!projectId) {
      throw { status: 400, message: "Project ID is required" }
    }

    return database.remove(projectId, "projects")
  }

  async sendInvite(email, rolesString) {
    try {
      let userObj = new User()
      let user = await userObj.getByEmail(email)
      const roles = this.parseRoles(rolesString)
      let updatedProject
      let message = `You have been invited to the TPEN project ${this.data?.label}. 
      View project <a href=https://www.tpen.org/project/${this.data._id}>here</a>.`
      if (user) {
        await this.inviteExistingTPENUser(user._id, roles)
      } else {
        const inviteCode = await this.inviteNewTPENUser(email, roles)
        // We will replace this URL with the correct url
        const url = `https://cubap.auth0.com/u/signup?invite-code=${inviteCode}`
        message += `<p>Click the button below to get started with your project</p> 
        <button class = "buttonStyle" ><a href=${url} >Get Started</a> </button>
        or copy the following link into your web browser <a href=${url}>${url}</a> </p>`
      }

      sendMail(email, `Invitation to ${this.data?.label}`, message)
      return this
    } catch (error) {
      throw error
    }
  }

  async checkUserAccess(userId, action, scope, entity) {
    if (!this.data) {
      await this.#load()
    }

    const groupMembers = new Group(this.data.group).getMembers()
    const userRoles = groupMembers[userId]?.roles

    if (!userRoles) {
      return {
        hasAccess: false,
        message: "User is not a member of this project."
      }
    }

    const combinedPermissions = this.getCombinedPermissions(userRoles)

    const hasAccess = combinedPermissions.some(permission => {
      const [permAction, permScope, permEntity] = permission.split("_")

      return (
        (permAction === action || permAction === "*") &&
        (permScope === scope || permScope === "*") &&
        (permEntity === entity || permEntity === "*")
      )
    })

    return hasAccess
      ? {
        hasAccess: true,
        permissions: combinedPermissions,
        message: "User has access to the project."
      }
      : {
        hasAccess: false,
        message: `User does not have ${action} access to ${scope == "*" ? "ALL" : scope} on ${entity}.`
      }
  }

  getCombinedPermissions(roles) {
    const combinedPermissions = []
    const group = new Group(this.data.group)
    const groupRoles = group.getPermissions()
    roles.forEach(role => {
      combinedPermissions.push(groupRoles[role])
    })

    return combinedPermissions
  }

  parseRoles(rolesString) {
    const roles = rolesString?.toUpperCase().split(" ") ?? ["CONTRIBUTOR"]
    return roles
  }

  async inviteExistingTPENUser(userId, roles) {
    const group = new Group(this.data.group)
    group.addMember(userId, roles)
    await group.save()
    return this
  }

  async inviteNewTPENUser(email, roles) {
    const user = new User()
    Object.assign(user, {
      email,
      inviteCode: this.#encryptInviteCode(user._id),
      agent: `https://store.rerum.io/v1/id/${user._id}`,
      profile: { displayName: email.split("@")[0] }
    })
    await user.save()
    await this.inviteExistingTPENUser(user._id, roles)

    return user.inviteCode
  }

  async removeMember(userId) {
    try {
      const group = new Group(this.data.group)
      group.removeMember(userId)
      await group.save()
      return this
    } catch (error) {
      throw {
        status: error.status || 500,
        message: error.message || "An error occurred while removing the member."
      }
    }
  }

  #encryptInviteCode(userId) {
    const date = Date.now().toString()
    const data = `${date}:${userId}`

    const iv = Buffer.from(process.env.INVITE_CODE_IV, "hex")
    const secretKey = Buffer.from(process.env.INVITE_CODE_SECRET, "hex")

    const cipher = crypto.createCipheriv("aes-256-cbc", secretKey, iv)

    let encrypted = cipher.update(data)
    encrypted = Buffer.concat([encrypted, cipher.final()])

    return iv.toString("hex") + ":" + encrypted.toString("hex")
  }

  async #load() {
    return database.getById(this._id, "projects").then((resp) => {
      this.data = resp
    })
  }
}
