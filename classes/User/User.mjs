import dbDriver from "../../database/driver.mjs"
let err_out = Object.assign(new Error(), {"status":123, "message":"N/A"})

import DatabaseController from "../../database/mongo/controller.mjs"
import {
  includeOnly,
  removeProperties
} from "../../utilities/removeProperties.mjs"

const database = new dbDriver("mongo")
export class User {
  constructor(user) {
    // database = new DatabaseController() // has a 'find' error that breaks the app at instance. when this this fixed this line will replace the above

    if (user instanceof Object) {
      this.id = user._id
    } else {
      this.id = user
    }
  }

  async getUserById() {
    // returns user's public info
    // find() will be replaced with getById() when the find error in DatabaseController() is fixed
    let user = await database.find({
      _id: this.id,
      "@type": "User"
    })
    user = user[0]
    this.id = user?._id
    const publicUser = includeOnly(user, "profile", "_id")
    this.user = publicUser
    return publicUser
  }

  async getSelf() {
    // returns full user object, only use this when the user is unthenticated i.e, logged in and getting himself.

    const user = await database.find({
      _id: this.id,
      "@type": "User"
    })
    return user[0]
  }

  async updateRecord(data) {
    // updates user object. use with PUT or PATCH on authenticated route only
    if (!data) return
    const previousUser = this.user
    const newRecord = {...previousUser, ...data}
    const updatedUser = await database.update(newRecord)
    return updatedUser
  }


async getByAgent(agent){
  if(!agent){
    err_out.message = "No agent provided"
    err_out.status = 400 
    throw err_out
  }

  const user = await database.find({agent, "@type":"User"})
  
  return user[0]

}


  async create(data) { 
    // POST requests
    if (!data) {
      err_out.message = "No data provided"
      err_out.status = 400 
      throw err_out
    }

    try {
      const user = await database.save({...data, "@type":"User"}) 
      return user
    } catch (error) {
      throw error
    }
  }

  async getProjects() {
    // this assumes that the project object includes the following properties
    // {
    //   "@type":"Project"
    //   creator:"user._id",
    //   groups:{
    //     members:[{agent:"user.agent", _id:"user._id"}]
    //   }
    // }
    const user = await this.getSelf()
    if (!user) return []
    const allProjects = await database.find({
      "@type": "Project"
    })
    const userProjects = []
    allProjects?.map((project) => {
      if (project.creator === this.id) {
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
  }
}



const userObj = new User("660d801652df1c2243d6d935")

console.log(await userObj.getSelf())

