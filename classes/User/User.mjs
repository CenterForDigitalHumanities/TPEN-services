import dbDriver from "../../database/driver.mjs"
import {
  includeOnly,
  removeProperties
} from "../../utilities/removeProperties.mjs"

export class User {
  constructor(user = null, database = "mongo") {
    this.database = new dbDriver(database)

    if (user instanceof Object) {
      this.id = user._id
    } else {
      this.id = user
    }
    this._fetchUser()
  }

  async _fetchUser() {
    let user = await this.database.find({
      _id: this.id,
      "@type": "users"
    })
    if (Array.isArray(user)) {
      user = user[0]
    }
    this.id = user?._id 
    return (this.user = user)
  }

  async getUserById() {
    // returns user's public info

    return includeOnly(this.user, "profile")
    // return removeProperties(this.user, "profile", "mbox", "cardInfo")
  }

  async getSelf() {
    // returns full user object, only use this when the user is unthenticated i.e, logged in and getting himself.
    return this.user

    // const user = await this.database.find({
    //   _id: userId,
    //   "@type": "UserPreferences"
    // })
    // if (Array.isArray(user)) {
    //   return user[0]
    // } else {
    //   return user
    // }
  }

  async updateRecord(data) {
    // updates user object. use with PUT or PATCH
    if (!data) return
    const previousUser = this.user
    const newRecord = {...previousUser, ...data}
    const updatedUser = await this.database.update(newRecord)
    return updatedUser
  }

  async getProjects() {
    const projects = await this.database.find({
      "@type": "Project",
      creator: this.id
    })
    return projects
  }



  
  /**
   *
   * @param projectData JSON object containing project detail including {"creator":"id"}
   * @returns the same object if creation is successful
   */
  async createProject(projectData) {
    const newProject = await this.database.save({
      ...projectData,
      "@type": "Project",
      creator: this.id
    })
    return newProject
  }

  async deleteUser() {
    await this.database.delete(user)
  }

  // Method to update a project
  async updateProject(data) {
    // data = {...otherProperties, id:projectId}
    try {
      const updatedProject = await this.database.update(data)
      return updatedProject
    } catch (error) {
      throw new Error("Failed to update project")
    }
  }

  async deleteProject(projectId) {
    try {
      await this.database.deleteProject(projectId)
      return true
    } catch (error) {
      throw new Error("Failed to delete project")
    }
  }
}
