import dbDriver from "../../database/driver.mjs"
import {validateProjectPayload} from "../../utilities/validatePayload.mjs"
import {User} from "../User/User.mjs"
import ProjectFactory from "./ProjectFactory.mjs"

let err_out = Object.assign(new Error(), {
  status: 500,
  message: "Unknown Server error"
})

const database = new dbDriver("mongo")

export default class Project {
  #creator
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
   * @param {any} userAgent
   */
  set creator(userAgent) {
    this.#creator = userAgent
  }
  async create(payload) {
    // validation checks for all the required elements without which a project cannot be created. modify validateProjectPayload function to include more elements as they become available (layers,... )
    const validation = validateProjectPayload(payload)

    if (!validation.isValid) {
      err_out.status = 400
      err_out.message = validation.errors
      throw err_out
    }

    try {
      return database.saveProject(payload, "Project")
    } catch (err) {
      throw {
        status: err.status || 500,
        message: err.message || "An error occurred while creating the project"
      }
    }
  }

  async delete(projectId) {
    if (!projectId) {
      err_out.message = "Project ID is required"
      err_out.status = 400
      throw err_out
    }

    return database.remove(projectId)
  }

  async #getById(projectId) {
    if (!projectId) {
      err_out.message = "Project ID is required"
      err_out.status = 400
      throw err_out
    }
    return database.getById(projectId, "Project").then((resp) => {
      this.projectData = resp
    })
  }


 checkUserAccess(userAgent) {
  if (!this.projectData) {
    return {
      hasAccess: false,
      message: "Project data is not loaded.",
    };
  } 

  if (this.projectData.creator === userAgent) {
    return {
      hasAccess: true,
      message: "User is the creator of the project and has access.",
    };
  }

  if (!this.projectData.groups) {
    return {
      hasAccess: false,
      message: "Project structure is incomplete. Missing groups information.",
    };
  }

  if (!this.projectData.groups.members || this.projectData.groups.members.length === 0) {
    return {
      hasAccess: false,
      message: "Project has no members.",
    };
  }

   for (const member of this.projectData.groups.members) {
    if (member.agent === userAgent) {
      return {
        hasAccess: true,
        message: "User is a member of the project and has access.",
      };
    }
  }

  return {
    hasAccess: false,
    message: "User has no access to this project.",
  };
}
}
