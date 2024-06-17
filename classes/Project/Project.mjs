import dbDriver from "../../database/driver.mjs"
import { validateProjectPayload } from "../../utilities/validatePayload.mjs"
import {User} from "../User/User.mjs"

let err_out = Object.assign(new Error(), {
  status: 500,
  message: "Unknown Server error",
 })

const database = new dbDriver("mongo")

export default class Project {
  constructor(userId) {
    this.creator = userId
  }

  async create(payload) {
    // validation checks for all the required elements without which a project cannot be created. modify validateProjectPayload function to include more elements as they become available (layers,... )
    const validation = validateProjectPayload(payload)
 
    if (!validation.isValid) {
      err_out.status = 400
      err_out.message =   validation.errors
      throw err_out
    }

    try {
      const result = await database.save({...payload, "@type": "Project"})
      return {
        status: 201,
        message: "Project created successfully",
        data: result
      }
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

  async getProject(projectId) {
    if (!projectId) {
      err_out.message = "Project ID is required"
      err_out.status = 400
      throw err_out
    }
    return database
      .getById(projectId)
      .then((resp) => {
        resp.json()
      })
      .catch((error) => {
        console.log(error)
        throw error
      })
  }

  async getProjects() {
    const userObj = new User(this.creator)
    return await userObj.getProjects()
  }
}
