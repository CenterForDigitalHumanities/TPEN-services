import dbDriver from "../../database/driver.mjs"
import Permissions from "../../project/groups/permissions.mjs"
import Roles from "../../project/groups/roles.mjs"
import { sendMail } from "../../utilities/mailer/index.mjs"
import { validateProjectPayload } from "../../utilities/validatePayload.mjs"
import { User } from "../User/User.mjs"
import crypto from "crypto"

const database = new dbDriver("mongo")

export default class Project {
  constructor(projectId) {
    this.projectId = projectId
    this.projectData = null
    if (projectId) {
      return (async () => {
        await this.#getById(projectId)
        return this
      })()
    }
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
      return database.save(payload)
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

    return database.remove(projectId)
  }

  async addMember(email, rolesString) {
    try {
      let userObj = new User()
      let user = await userObj.getByEmail(email)
      const roles = this.parseRoles(rolesString)
      let updatedProject
      let message = `You have been invited to the TPEN project ${this.projectData?.name}. View project <a href=https://www.tpen.org/project/${this.projectData._id}>here</a>.`
      if (user) {
        updatedProject = await this.inviteExistingTPENUser(user, roles)
      } else {
        let { newUser, projectData } = await this.inviteNewTPENUser(email, roles)
        // We will replace this URL with the correct url
        const url = `https://cubap.auth0.com/u/signup?invite-code=${newUser.inviteCode}`
        updatedProject = projectData
        user = newUser
        message += `<p>Click the button below to get started with your project</p> 
        <button class = "buttonStyle" ><a href=${url} >Get Started</a> </button>
        or copy the following link into your web browser <a href=${url}>${url}</a> </p>`
      }

      sendMail(user, `Invitation to ${this.projectData?.name}`, message)
      return updatedProject
    } catch (error) {
      throw {
        status: error.status || 500,
        message: error.message || "An error occurred while adding the member."
      }
    }
  }
 
  checkUserAccess(userId, action, scope, entity) {
    if (!this.projectData) {
      return {
        hasAccess: false,
        message: "Project data is not loaded."
      }
    }

    const userRoles = this.projectData.contributors[userId]?.roles

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
        message:`User does not have ${action} access to ${scope=="*"?"ALL":scope} on ${entity}.`
      }
  }

  getCombinedPermissions(roles) {
    const combinedPermissions = []

    roles.forEach((role) => {
      const rolePermissions = Permissions[role] || []
      combinedPermissions.push(...rolePermissions)
    })

    return combinedPermissions
  }

  parseRoles(rolesString) {
    const roles = rolesString?.toUpperCase().split(" ") ?? ["CONTRIBUTOR"]
    return roles
  }

  async inviteExistingTPENUser(user, roles) {
    this.projectData.contributors = this.projectData.contributors || {}
    this.projectData.contributors[user._id] = {
      displayName: user.displayName ?? user.nickname,
      email: user?.email,
      agent:
        user.agent ??
        user["http://store.rerum.io/agent"] ??
        `https://store.rerum.io/v1/id/${user._id}`,
      roles: roles,
      permissions: this.getCombinedPermissions(roles)
    }

    return await database.update(this.projectData)
  }

  async inviteNewTPENUser(email, roles) {
    const userPayload = {
      inviteCode: Date.now(),
      email
    }
    const userObj = new User()
    const newUser = await userObj.create(userPayload)
    newUser.agent = `https://store.rerum.io/v1/id/${newUser._id}`
    newUser.inviteCode = this.#encryptInviteCode(newUser._id)


    await userObj.updateRecord(newUser)

    const projectData = await this.inviteExistingTPENUser(newUser, roles)

    return { newUser, projectData }
  }

  async removeMember(userId) {
    try {
      if (!this.projectData.contributors || !this.projectData.contributors[userId]) {
        throw {
          status: 404,
          message: "User not found in the project's contributor list."
        }
      }

      delete this.projectData.contributors[userId]

      return database.update(this.projectData)
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

  async #getById(projectId) {
    return database.getById(projectId, "Project").then((resp) => {
      this.projectData = resp
    })
  }


}
