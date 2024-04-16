import dbDriver from "../../database/driver.mjs"
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
    const publicUser = includeOnly(user, "profile")
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

  async getProjects() {
    const allProjects = await database.find({
      "@type": "Project"
    })
    const userProjects = []
    allProjects?.map((project) => {
      project.group?.members?.map((member) => {
        // const memberId = member.agent.split("id/")[1]
        // if(memberId === this.id){
        //   userProjects.push(project)
        // }

        if (member.agent === this.getSelf().agent || member._id === this.id) {
          userProjects.push(project)
        }
      })
    })

    return userProjects
  }

  // async getProjects() {
  //   const projects = await database.find({
  //     "@type": "Project",
  //     creator: this.id
  //   })
  //   return projects
  // }
}

// Usage
const userObject = new User("660d801652df1c2243d6d935")
const fullDetails = await userObject.getSelf()
const publicDetails = await userObject.getUserById()
const userProjects = await userObject.getProjects()

console.log(userObject)


