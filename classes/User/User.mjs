import dbDriver from "../../database/driver.mjs"
let err_out = Object.assign(new Error(), {"status":500, "message":"N/A"})

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

    
    if (!this.id) {
      err_out.message = "No user ID found. Instantiate User class with a proper ID as follows new User(UserId)"
      err_out.status = 400
      throw err_out
    }

    return  database.find({
      _id: this.id,
      "@type": "User"
    })
    .then(resp => {
      if (resp instanceof Error) { 
        throw resp;
      } 
      const user = resp[0]
      this.id = user?._id 
      const publicUser = includeOnly(user, "profile", "_id")
      this.user = publicUser
      return publicUser 
    })
    .catch(err => { 
      throw err; 
    });
 
  }

  async getSelf() {
    // returns full user object, only use this when the user is unauthenticated i.e, logged in and getting himself. 
    return  database.find({
      _id: this.id,
      "@type": "User"
    })
    .then(resp => {
      if (resp instanceof Error) { 
        throw resp;
      } 
      return resp[0];
    })
    .catch(err => { 
      throw err; 
    });
 
  }

  async updateRecord(data) {
    // updates user object. use with PUT or PATCH on authenticated route only
    if (!data) {
      err_out.message = "No payload provided"
      err_out.status = 400 
      throw err_out
    }

    const previousUser = await this.getSelf() 
    const newRecord = {...previousUser, ...data} 

    return database.update(newRecord).then((resp)=>{
      console.log("entered here")
      if(resp instanceof Error){ 
        throw(resp)
      }
     return resp
      
    }).catch((error)=> Promise.reject(error))


  }

 async getByAgent(agent){
  if(!agent){
    err_out.message = "No agent provided"
    err_out.status = 400 
    throw err_out
  }  

  return  database.find({
    agent, 
    "@type": "User"
  })
  .then(resp => { 
    if (resp instanceof Error) { 
      throw resp;
    }  
    return resp[0];
  })
  .catch(err => {  
    throw err; 
  });

  // const user = await database.find({agent, "@type":"User"})
  
  // return user[0]

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
    //   creator:"user.agent",
    //   groups:{
    //     members:[{agent:"user.agent", _id:"user._id"}]
    //   }
    // }
    
    const user = await this.getSelf()
    if (!user) {
      err_out.message = "User account not found"
      err_out.status = 404 
      throw err_out
    }
    // const allProjects = await database.find({
    //   "@type": "Project"
    // }) 

    return database.find({"@type":"Project"}).then((resp)=>{
      if (resp instanceof Error){
        throw(resp)
      }
      const allProjects= resp
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
    }).catch((error)=>{throw error})



    
  }
  async addPublicInfo(data) {
    // add or modify public info
    if (!data) return
    const previousUser = this.user
    const publicProfile = {...previousUser.profile, ...data}
    const updatedUser = await database.update({...previousUser, profile:publicProfile})
    return updatedUser
  }
}
