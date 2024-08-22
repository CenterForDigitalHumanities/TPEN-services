import dbDriver from "../../database/driver.mjs"
import Permissions from "../../project/groups/permissions.mjs"
import Roles from "../../project/groups/roles.mjs"
import {sendMail} from "../../utilities/mailer/index.mjs"
import {validateProjectPayload} from "../../utilities/validatePayload.mjs"
import {User} from "../User/User.mjs"
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
      throw {status: 400, message: validation.errors}
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
      throw {status: 400, message: "Project ID is required"}
    }

    return database.remove(projectId)
  }

  async addMember(email, rolesString) {
    try {
      let user = await User.getByEmail(email)
      const roles = this.parseRoles(rolesString)
      let updatedProject
      let message = `You have been invited to the TPEN project ${
        this.projectData?.name
      } with the following role(s): ${roles.join(", ")}.`

      if (user) {
        updatedProject = await this.inviteExistingTPENUser(user, roles)
      } else {
        let {newUser, projectData} = await this.inviteNewTPENUser(email, roles)
        // We will replace this URL with the correct url
        const url = `https://cubap.auth0.com/u/signup?invite-code=${newUser.inviteCode}`
        updatedProject = projectData
        user = newUser
        message += `<p>Click the button below to get started with your project</p> 
        <button class = "buttonStyle" ><a href=${url} >Get Started</a> </button>
        or copy the following link into your web browser <a href=${url}>${url}</a> </p>`
      }

      await sendMail(user, `Invitation to ${this.projectData?.name}`, message)
      return updatedProject
    } catch (error) {
      throw {
        status: error.status || 500,
        message: error.message || "An error occurred while adding the member."
      }
    }
  }

  checkUserAccess(userAgent, action) {
    if (!this.projectData) {
      return {
        hasAccess: false,
        message: "Project data is not loaded."
      }
    }

    if (this.projectData.creator === userAgent) {
      return {
        hasAccess: true,
        permissions: {
          members: "MODIFY_ALL",
          project: "MODIFY_ALL",
          annotations: "MODIFY_ALL"
        },
        message: "User is the creator of the project and has full access."
      }
    }

    if (!this.projectData.groups) {
      return {
        hasAccess: false,
        message: "Project structure is incomplete. Missing groups information."
      }
    }

    const member = Object.values(this.projectData.groups).find(
      (member) => member.agent === userAgent
    )

    if (!member) {
      return {
        hasAccess: false,
        message: "User is not a member of this project."
      }
    }

    const permissions = member?.permissions
    return {
      hasAccess: true,
      permissions: permissions,
      message: "User has access to the project"
    }
  }

  getCombinedPermissions(roles) {
    const combinedPermissions = {
      members: "NONE",
      project: "NONE",
      annotations: "NONE"
    }

    roles.forEach((role) => {
      const rolePermissions = Permissions[role] || {}
      Object.keys(rolePermissions).forEach((key) => {
        combinedPermissions[key] = rolePermissions[key]
      })
    })

    return combinedPermissions
  }

  parseRoles(rolesString) {
    const roles = rolesString.toUpperCase().split(" ")

    roles.forEach((role) => {
      if (!Object.values(Roles).includes(role)) {
        throw {status: 406, message: `Invalid role: ${role}`}
      }
    })

    return roles
  }

  async inviteExistingTPENUser(user, roles) {
    this.projectData.groups = this.projectData.groups || {}
    this.projectData.groups[user._id] = {
      displayName: user.displayName ?? user.nickname,
      email: user?.email,
      agent:
        user.agent ??
        user["http://store.rerum.io/agent"] ??
        `https://store.rerum.io/v1/id/${user._id}`,
      roles: roles,
      permissions: this.getCombinedPermissions(roles)
    }

    return await this.#updateProject()
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

    return {newUser, projectData}
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

  async #updateProject() {
    return await database.update(this.projectData)
  }
}
