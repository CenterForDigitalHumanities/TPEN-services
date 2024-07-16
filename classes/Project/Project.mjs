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
  constructor() {}

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

  async getById(projectId) {
    if (!projectId) {
      err_out.message = "Project ID is required"
      err_out.status = 400
      throw err_out
    }
    return database
      .getById(projectId, "Project")
      .then((resp) => (resp?.length ? resp[0] : resp))
  }

  async getProjects() {
    const userObj = new User(this.id)
    return await userObj.getProjects()
  }
}
