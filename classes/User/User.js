import dbDriver from "../../database/driver.js"

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

  async updateProfile(data) {
    this.data = await this.getSelf()
    this.data.profile = data
    return await this.update()
  }

  async getSelf() {
    if (!this.data) {
      await this.#loadFromDB()
    }
    return this.data
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
    if (!email) throw new Error("No email provided")

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

  static async setLastModified(userId, lastModified) {
    const user = await database.getById(userId, "users")
    if (!user) {
      throw new Error(`User with _id ${userId} not found`)
    }
    user._lastModified = lastModified
    return database.update(user, "users")
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

    // Check for duplicate email
    try {
      const existingUser = await this.getByEmail(this.data.email)
      if (existingUser && existingUser._id !== this._id) {
        throw new Error(`User with email ${this.data.email} already exists`)
      }
    } catch (err) {
      // getByEmail throws if not found - that's ok, continue
      // But re-throw if it's our duplicate error or other errors
      if (err.message.includes("already exists") || (!err.message.includes("not found") && err.message !== "No email provided")) {
        throw err
      }
    }

    // save user to database
    return database.save({ _id: this._id, ...this.data }, "users")
  }

  async delete() {
    // delete user from database
    return database.delete({ _id: this._id}, "users")
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

  async update(){
    if (!this._id) {
      throw new Error("User must have an _id")
    }
    if (!this.data.email) {
      throw new Error("User must have an email")
    }
    if (!this.data.profile?.displayName) {
      throw new Error("User must have a profile with a displayName")
    }
    return database.update(this.data, "users")
  }

  async getProjects() {
    return database.controller
      .db.collection('projects').aggregate([
        // Step 1: Lookup the related group details
        {
          $lookup: {
            from: "groups",
            localField: "group",   // Field in `projects` referencing `_id` in `groups`
            foreignField: "_id",
            as: "groupInfo"
          }
        },
        // Step 2: Filter for projects where the user is in the group's members
        {
          $match: {
            "groupInfo.members": { $exists: true },
            [`groupInfo.members.${this._id}`]: { $exists: true }
          }
        },
        // Step 3: Project the required fields including the user's roles
        {
          $project: {
            _id: 1,                        // Project ID
            title: 1,                      // Project title
            label: 1,                      // Project label
            collaborators: { $arrayElemAt: [`$groupInfo.members`, 0] },  // User collaborators within the group
            roles: { $arrayElemAt: [`$groupInfo.members.${this._id}.roles`, 0] },  // User roles within the group
            _lastModified: 1, // Last modified page
            _createdAt: 1,    // Creation date
            _modifiedAt: 1 // Last modified date
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
}
