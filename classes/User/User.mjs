import {removeProperties} from "../../utilities/removeProperties.mjs"

export class User {
  constructor(database) {
    this.database = database
  }

  async getUserById(userId, privateDetails=["profile", "@type", "agent"]) {
    let user = await this.database.find({
      _id: userId,
      "@type": "UserPreferences"
    })
    if (Array.isArray(user)) {
      user = user[0]
    }
    return removeProperties(user, ...privateDetails)
  }

  async getSelf(userId) {
    // returns full user object, only use this when the user is unthenticated i.e, logged in and getting himself.
    const user = await this.database.find({
      _id: userId,
      "@type": "UserPreferences"
    })
    if (Array.isArray(user)) {
      return user[0]
    } else {
      return user
    }
  }

  async updateUser(data) {
    if(!data) return 
    const previousUser = await this.getSelf(data?._id);
    const updatedUser = { ...previousUser, ...data }; 
     const result = await this.database.update(updatedUser);
     return result
  }

  async getProjects(userId) {  
    const projects = await this.database.find({
      "@type": "Project",
      author: userId
    })
    return projects 
}

 /**
  * 
  * @param projectData JSON object containing project detail including {"author":"user._id"}
  * @returns the same object if creation is successful
  */
  async createProject(projectData) {
     const newProject = await this.database.save({...projectData, "@type":"Project"})
    return newProject
 }








async createUser(userData) {
    const newUser = await this.database.save(userData)
    return newUser
  }


async deleteUser(userId) {
    try {
      await this.database.delete(id, userId)
      return true
    } catch (error) {
      throw new Error("Failed to delete user")
    }
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
