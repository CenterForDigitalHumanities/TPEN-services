import dbDriver from "../../database/driver.mjs"

const database = new dbDriver("mongo")
export default class User {
  constructor(userId = database.reserveId()) {
    this._id = userId
  }

  /**
   * Load user from database driver.
   * @returns user object
   * @throws {Error} any database error
   */
  async #loadFromDB() {
    // load user from database
    // TODO: possibly delete anything reserved for TPEN only
    this.data = await database.getById(this._id, "users")
    return this
  }

  async getSelf() {
    return await (this.data ?? this.#loadFromDB().then(u => u.data))
  }
  
  async getPublicInfo() {
    // returns user's public info 
    if (this.data) {
      return { _id: this._id, ...this.data.profile };
    }
  
    const user = await database.getById(this._id, "users");
    if (!user) {
      throw new Error(`User with _id ${this._id} not found`);
    }
  
    return { _id: user._id, ...user.profile };
  }
  
  async getByEmail(email) {
    if (!this.data.email) {
      throw {
        status: 400,
        message: "No email provided"
      }
    }

    return database
      .findOne({ email }, "users")
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

  static async create(data) {
    // POST requests
    if (!data) {
      throw {
        status: 400,
        message: "No data provided"
      }
    }
    if (data._id) {
      const existingUser = await database.getById(data._id, "users")
      if (existingUser) {
        const err = new Error("User already exists")
        err.status = 400
        throw err
      }
    }
    if (!data.profile || !data.profile.displayName) {
      data.profile = data.profile || {}
      data.profile.displayName = data.email?.split("@")[0]
        ?? data.name
        ?? data.displayName
        ?? data.fullName
        ?? `User ${new Date().toLocaleDateString()}`
    }
    const user = new User()
    Object.assign(user, data)
    return user.save()
  }

  async save() {
    // validate before save
    if (!this._id) {
      throw new Error("User must have an _id")
    }
    if (!this.data.email) {
      throw new Error("User must have an email")
    }
    if (!this.data.profile?.displayName) {
      throw new Error("User must have a profile with a displayName")
    }
    // save user to database
    return database.save({ _id: this._id, ...this.data }, "users")
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

    // gross. I hate it.
    return database
      .find({ "@type": "Project" })
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
  }
  async addPublicInfo(data) {
    // add or modify public info
    if (!data) return
    const previousUser = this.data
    const publicProfile = { ...previousUser.profile, ...data }
    const updatedUser = await database.update({
      ...previousUser,
      profile: publicProfile
    })
    return updatedUser
  }
}
