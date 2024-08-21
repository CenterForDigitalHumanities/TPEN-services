import dbDriver from "../../database/driver.mjs"
import Permissions from "../../project/groups/permissions.mjs"
import Roles from "../../project/groups/roles.mjs"
import {sendMail} from "../../utilities/mailer/index.mjs"
import {validateProjectPayload} from "../../utilities/validatePayload.mjs"
import {User} from "../User/User.mjs"

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
      const user = await User.getByEmail(email)
      const roles = this.parseRoles(rolesString)

      if (user) {
        this.projectData.groups = this.projectData.groups || {}
        this.projectData.groups[user._id] = {
          displayName: user.displayName ?? user.nickname,
          agent:
            user.agent ??
            user["http://store.rerum.io/agent"] ??
            `https://store.rerum.io/v1/id/${user._id}`,
          roles: roles,
          permissions: this.getCombinedPermissions(roles)
        }

        const updatedProject = await this.#updateProject()
        const message = `You have been successfully added to ${
          this.projectData?.name
        }with the following role(s): ${roles.join(", ")}`
        await sendMail(user, `Invitation to ${this.projectData?.name}`, message)

        return updatedProject
      } else {
        console.log(
          `No user with email ${email} exists. Proceed to send an invitation.`
        )
      }
    } catch (error) {
      console.error(
        "Error in adding member:",
        error.message || error.toString()
      )
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
    const roles = rolesString.split(" ")

    roles.forEach((role) => {
      if (!Object.values(Roles).includes(role)) {
        throw {status: 406, message: `Invalid role: ${role}`}
      }
    })

    return roles
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
