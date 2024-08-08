import dbDriver from "../../database/driver.mjs"
import {includeOnly} from "../../utilities/removeProperties.mjs"

const database = new dbDriver("mongo")
export class User {
  constructor(userId) {
    this.id = userId
    this.userData = null
    if (userId) {
      return (async () => {
        await this.getById()
        return this
      })()
    }
  }

  async getById() { 
    // returns user's public info
    try {
     await this.getSelf(this.id).then((user) => { 
        let publicUserInfo = includeOnly(user, "profile", "_id")
        this.userData = publicUserInfo  
        return publicUserInfo
      })
    } catch (error) {
      console.log(error);
    }
  }

  async getSelf(id) {
    // returns full user object, only use this when the user is unauthenticated i.e, logged in and getting himself.

    if (!id) {
      throw {
        status: 400,
        message:
          "No user ID found. Instantiate User class with a proper ID as follows new User(UserId)"
      }
    }

    return database
      .getById(id, "User")
      .then((resp) => {
        if (resp instanceof Error) {
          throw resp
        }
        return resp
      })
      .catch((err) => {
        throw err
      })
  }

  async updateRecord(data) {
    // updates user object. use with PUT or PATCH on authenticated route only
    if (!data) {
      throw {
        status: 400,
        message: "No payload provided"
      }
    }

    const previousUser = await this.getSelf()
    const newRecord = {...previousUser, ...data}

    return database
      .update(newRecord)
      .then((resp) => {
        if (resp instanceof Error) {
          throw resp
        }
        return resp
      })
      .catch((err) => {
        throw err
      })
  }

  async getByAgent(agent) {
    if (!agent) {
      throw {
        status: 400,
        message: "No agent provided"
      }
    }

    return database
      .findOne({
        agent,
        "@type": "User"
      })
      .then((resp) => {
        if (resp instanceof Error) {
          throw resp
        }
        return resp
      })
      .catch((err) => {
        throw err
      })
  }

  async create(data) {
    // POST requests
    if (!data) {
      throw {
        status: 400,
        message: "No data provided"
      }
    }

    try {
      const user = await database.save({...data, "@type": "User"})
      return user
    } catch (error) {
      throw error
    }
  }

  /**
   *  this assumes that the project object includes the following properties
    {
      "@type":"Project"
      creator:"user.agent",
      groups:{
        members:[{agent:"user.agent", _id:"user._id"}]
      }
    }
   * @returns project object
   */
  async getProjects() {
    const user = await this.getSelf()
    if (!user) {
      throw {
        status: 404,
        message: "User account not found"
      }
    }

    return database
      .find({"@type": "Project"})
      .then((resp) => {
        if (resp instanceof Error) {
          throw resp
        }
        const allProjects = resp
        const userProjects = []
        allProjects?.map((project) => {
          if (project.creator === user.agent) {
            userProjects.push(project)
          } else {
            project?.groups?.members?.map(async (member) => {
              if (member.agent === user?.agent || member._id === this.id) {
                userProjects.push(project)
              }
            })
          }
        })

        return userProjects
      })
      .catch((error) => {
        throw error
      })
  }
  async addPublicInfo(data) {
    // add or modify public info
    if (!data) return
    const previousUser = this.user
    const publicProfile = {...previousUser.profile, ...data}
    const updatedUser = await database.update({
      ...previousUser,
      profile: publicProfile
    })
    return updatedUser
  }
}
