import dbDriver from "../../database/driver.js"

export const defaultDatabase = () => new dbDriver("mongo")
export default class User {
  constructor(userId = defaultDatabase.reserveId(), database = defaultDatabase()) {
    this._id = userId
    this.database = database
  }

  /**
   * Load user from database driver.
   * @returns user object
   * @throws {Error} any database error
   */
  async #loadFromDB() {
    this.data = await this.database.getById(this._id, "users")
    return this
  }

  async updateProfile(data) {
    this.data = await this.getSelf()
    this.data.profile = data
    return await this.update()
  }

  async getSelf() {
    return await (this.data ?? this.#loadFromDB().then(u => u.data))
  }
  
  async getPublicInfo() {
    if (this.data) {
      return { _id: this._id, ...this.data.profile }
    }
    const user = await this.database.getById(this._id, "users")
    if (!user) {
      throw new Error(`User with _id ${this._id} not found`)
    }
    return { _id: user._id, ...user.profile }
  }
  
  async getByEmail(email) {
    if (!email) throw new Error("No email provided")
    return this.database
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

  static async create(data, database = defaultDatabase) {
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
    const user = new User(undefined, database)
    Object.assign(user, data)
    return user.save()
  }

  async save() {
    if (!this._id) {
      throw new Error("User must have an _id")
    }
    if (!this.data.email) {
      throw new Error("User must have an email")
    }
    if (!this.data.profile?.displayName) {
      throw new Error("User must have a profile with a displayName")
    }
    return this.database.save({ _id: this._id, ...this.data }, "users")
  }

  /**
   *  this assumes that the project object includes the following properties
    {
      creator:"user.agent",
      groups:{
        members:[{agent:"user.agent", _id:"user._id"}]
      }
    }
   * @returns project object
   */

  async update() {
    return this.database.update(this.data, "users")
  }

  async getProjects() {
    return this.database.controller
      .db.collection('projects').aggregate([
        {
          $lookup: {
            from: "groups",
            localField: "group",
            foreignField: "_id",
            as: "groupInfo"
          }
        },
        {
          $match: {
            "groupInfo.members": { $exists: true },
            [`groupInfo.members.${this._id}`]: { $exists: true }
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            label: 1,
            roles: { $arrayElemAt: [`$groupInfo.members.${this._id}.roles`, 0] }
          }
        }
      ]).toArray()
      .then((userProjects) => {
        if (userProjects instanceof Error) {
          throw userProjects
        }
        return userProjects
      })
  }

  async addPublicInfo(data) {
    if (!data) return
    const previousUser = this.data
    const publicProfile = { ...previousUser.profile, ...data }
    const updatedUser = await this.database.update({
      ...previousUser,
      profile: publicProfile
    }, "User")
    return updatedUser
  }
}
