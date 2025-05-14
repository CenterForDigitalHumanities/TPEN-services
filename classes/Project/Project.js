import dbDriver from "../../database/driver.js"
import { sendMail } from "../../utilities/mailer/index.js"
import { validateProjectPayload } from "../../utilities/validatePayload.js"
import User from "../User/User.js"
import { createHash } from "node:crypto"
import Group from "../Group/Group.js"

const database = new dbDriver("mongo")

export default class Project {
  constructor(_id) {
    this._id = _id
    this.data = null
  }

  /**
   * @param {Project} payload
   */

  async create(payload) {
    // validation checks for all the required elements without which a project cannot be created. modify validateProjectPayload function to include more elements as they become available (layers,... )
    const validation = validateProjectPayload(payload)
    
    if (!validation.isValid) {
      throw { status: 400, message: validation.errors }
    }
    
    console.log("Creating project...", payload.layers)
    try {
      return database.save(payload, "projects")
    } catch (err) {
      throw {
        status: err.status || 500,
        message: err.message || "An error occurred while creating the project"
      }
    }
  }

  async delete(projectId = this._id) {
    if (!projectId) {
      throw { status: 400, message: "Project ID is required" }
    }

    if (!this.data?.layers ?? this.data?.layers.length) {
      await this.#load()
    }

    this.data.layers.forEach(async (layer) => {
      const layerObj = new Layer(projectId, layer)
      await layerObj.delete()
    })

    return database.remove(projectId, "projects")
  }

  async sendInvite(email, rolesString) {
    try {
      let userObj = new User()
      let user = await userObj.getByEmail(email)
      const roles = this.parseRoles(rolesString)
      const projectTitle = this.data?.label ?? this.data?.title ?? 'TPEN Project'
      let message = `You have been invited to the TPEN project ${projectTitle}. 
      View project <a href='https://three.t-pen.org/project/${this.data._id}'>here</a>.`
      if (user) {
        await this.inviteExistingTPENUser(user._id, roles)
      } else {
        const inviteCode = await this.inviteNewTPENUser(email, roles)
        // We will replace this URL with the correct url
        const url = `https://three.t-pen.org/login?invite-code=${inviteCode}`
        message += `<p>Click the button below to get started with your project</p> 
        <button class = "buttonStyle" ><a href=${url} >Get Started</a> </button>
        or copy the following link into your web browser <a href=${url}>${url}</a> </p>`
      }

      await sendMail(email, `Invitation to ${projectTitle}`, message)
      return this
    } catch (error) {
      throw error
    }
  }

  async checkUserAccess(userId, action, scope, entity) {
    if (!this.data?.group) {
      await this.#load()
    }

    const userRoles = await new Group(this.data.group).getMemberRoles(userId)

    if (!userRoles) {
      return {
        hasAccess: false,
        message: "User is not a member of this project."
      }
    }

    const userPermissions = this.getCombinedPermissions(userRoles)

    return userPermissions.some(permission => {
      const [permAction, permScope, permEntity] = permission.split("_")

      return (
        (permAction === action || permAction === "*") &&
        (permScope === scope || permScope === "*") &&
        (permEntity === entity || permEntity === "*")
      )
    })
  }

  getLabel() {
    return this.data?.label ?? `No Label`
  }

  getCombinedPermissions(roles) {
    return [...new Set(Object.keys(roles).map(r => roles[r]).flat())]
  }

  parseRoles(rolesString) {
    if (Array.isArray(rolesString)) rolesString = rolesString.join(" ")
    rolesString ??= "VIEWER"
    if (typeof rolesString !== "string") throw new Error("Roles must be a string or an array of strings")
    const roles = rolesString?.toUpperCase().split(" ")
    return roles
  }

  async inviteExistingTPENUser(userId, roles) {
    const group = new Group(this.data.group)
    await group.addMember(userId, roles)
    return this
  }

  async inviteNewTPENUser(email, roles) {
    const user = new User()
    const inviteCode = this.#generateInviteCode(user._id)
    const agent = `https://store.rerum.io/v1/id/${user._id}`
    const profile = { displayName: email.split("@")[0] }
    const _sub = `temp-${user._id}` // This is a temporary sub for the user until they verify their email
    user.data = { email, _sub, profile, agent, inviteCode }
    await user.save()
    await this.inviteExistingTPENUser(user._id, roles)

    return user.inviteCode
  }

  async removeMember(userId) {
    try {
      const group = new Group(this.data.group)
      await group.removeMember(userId)
      await group.update()
      return this
    } catch (error) {
      throw {
        status: error.status || 500,
        message: error.message || "An error occurred while removing the member."
      }
    }
  }

  /**
 * Asynchronously updates the metadata of the current object and persists the changes.
 *
 * @param {Object} newMetadata - An object containing the new metadata properties to be assigned.
 * @returns {Promise<Object>} - A promise that resolves to the updated object after the changes have been saved.
 *
 * @example
 * const newMetadata = [{ label: 'Description'}{value: 'Updated description' }];
 * await instance.updateMetadata(newMetadata);
 * console.log(instance.data.metadata); // Outputs: { title: 'New Title', description: 'Updated description' }
 *
 * @throws {Error} Throws an error if the update operation fails.
 */

  async updateTools(selectedValues) {
    await this.#load()
    // Guard invalid input
    if (!Array.isArray(selectedValues)) return
    // Guard existing data in corrupted state
    if(!this.data?.tools) this.data.tools = []
    
    this.data.tools = this.data.tools.map(tool => {
      const match = selectedValues.find(t => t.value === tool.value)
      return {
        ...tool,
        state: match ? match.state : tool.state
      }
    })    
  
    return await this.update()
  }  

  async addTools(tools) {
    await this.#load()
    this.data.tools = [...this.data.tools, ...tools]
    return await this.update()
  }  

  async updateMetadata(newMetadata) {
    this.data.metadata = newMetadata
    return await this.update()
  }

  async update() {
    return await database.update(this.data, process.env.TPENPROJECTS)
  }

  async save() {
    return await database.save(this.data, process.env.TPENPROJECTS)
  }

  #generateInviteCode(userId) {
    const date = Date.now().toString()
    const data = `${date}:${userId}`

    const hash = createHash("sha256")
    hash.update(data)
    return hash.digest("hex")
  }

  async #load() {
    return database.getById(this._id, "projects").then((resp) => {
      this.data = resp
    })
  }

  async loadProject() {
    await this.#load()
    return this.data
  }

  static async getById(projectId) {
    const project = new Project(projectId)
    await project.#load()
    return project
  }
}
