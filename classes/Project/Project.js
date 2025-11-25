import dbDriver from "../../database/driver.js"
import { sendMail } from "../../utilities/mailer/index.js"
import { validateProjectPayload } from "../../utilities/validatePayload.js"
import { isNotValidName, isNotValidValue } from "../../utilities/validateNameValue.js"
import User from "../User/User.js"
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
    // Comprehensive validation checks for all the required elements and their data types. 
    // This prevents malformed projects with incorrect data types from being created.
    const validation = validateProjectPayload(payload)
    
    if (!validation.isValid) {
      throw { status: 400, message: validation.errors }
    }

    payload._createdAt ??= Date.now().toString().slice(-6)
    payload._modifiedAt ??= -1
    payload._lastModified ??= payload.layers?.[0]?.pages?.[0]?.id.split('/').pop() ?? true
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
      View project <a href='${process.env.TPENINTERFACES}project?projectID=${this.data._id}'>here</a>.`
      if (user) {
        // FIXME this does not have the functionality of an 'invite'.
        await this.inviteExistingTPENUser(user._id, roles)
      } 
      else {
        const inviteData = await this.inviteNewTPENUser(email, roles)
        const returnTo = encodeURIComponent(`${process.env.TPENINTERFACES}project?projectID=${this.data._id}&inviteCode=${inviteData.tpenUserID}`)
        // Signup starting at the TPEN3 public site
        const signup = `${process.env.TPENTHREE}login?inviteCode=${inviteData.tpenUserID}&returnTo=${returnTo}`
        // Decline endpoint in TPEN Services
        const decline = `${process.env.TPENINTERFACES}project/decline?email=${encodeURIComponent(email)}&user=${inviteData.tpenUserID}&project=${this.data._id}&projectTitle=${encodeURIComponent(projectTitle)}`
        message += `
          <p>
            Click the button below to get started with your project</p> 
            <button class="buttonStyle" ><a href="${signup}">Get Started</a></button>
            or copy the following link into your web browser <a href="${signup}">${signup}</a> 
          </p>
          <p>
            This E-mail address may be visible to members of the project so that they know
            about the potential of new members.  You may decline this invitation which will keep
            you out of the project and remove the visibility of this E-mail address from project details. <br>
            <a href="${decline}">Click here to decline the invitation.</a>
          </p>
        `
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

  async setLabel(label) {
    if (typeof label === "number") label += ""
    if (typeof label !== "string" || label.trim() === "") {
      throw new Error("Label must be a non-empty string")
    }
    if (!this?.data?.label) await this.#load()
    if (this.data.label.trim() === label.trim()) return this.data
    this.data.label = label.trim()
    return await this.update()
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

  /**
    * Invite an existing TPEN3 User to the project.
    * FIXME this does not have the functionality of an 'invite'.  The User is added to the project.  
    * There is no step for them to accept or decline.
    */
  async inviteExistingTPENUser(userId, roles) {
    await this.addMember(userId, roles)
    return this
  }

  /**
   * Add a new temporary user to the users collection and send the invite E-mail.
   * If a temp user with this email already exists (invited to another project), reuse it.
   * This allows users invited to multiple projects to use any invite link to complete signup.
   */
  async inviteNewTPENUser(email, roles) {
    // Check if a temp user already exists with this email
    const existingUserLookup = new User()
    let tempUser = null
    try {
      tempUser = await existingUserLookup.getByEmail(email)
    } catch (err) {
      // No user found - that's fine, we'll create one
    }

    if (tempUser && tempUser.inviteCode) {
      // Reuse existing temp user - just add to this project's group
      console.log(`\x1b[33mReusing existing temp user ${tempUser._id} for email ${email}\x1b[0m`)
      await this.inviteExistingTPENUser(tempUser._id, roles)
      return { "tpenUserID": tempUser._id, "tpenGroupID": this.data.group }
    }

    // Create new temp user
    const user = new User()
    const inviteCode = user._id
    const agent = `https://store.rerum.io/v1/id/${user._id}`
    const profile = { displayName: email.split("@")[0] }
    const _sub = `temp-${user._id}` // This is a temporary sub for the user until they verify their email
    user.data = { email, _sub, profile, agent, inviteCode }
    await user.save()
    console.log(`\x1b[33mCreated new temp user ${user._id} for email ${email}\x1b[0m`)
    // FIXME this does not have the functionality of an 'invite'.
    await this.inviteExistingTPENUser(user._id, roles)
    return { "tpenUserID": user._id, "tpenGroupID": this.data.group }
  }

  /**
   * Add a member to the Project Group.
   *
   * @param userId The User/member _id to add to the Group.
   */
  async addMember(userId, roles) {
    try {
      const group = new Group(this.data.group)
      await group.addMember(userId, roles)
    } catch (error) {
      throw {
        status: error.status || 500,
        message: error.message || "An error occurred while adding the member."
      }
    }
    
  }

  /**
   * Remove a member from the Project Group.
   * If the member is an invitee (temporary) User, delete that User from the db.
   *
   * @param userId The User/member _id to remove from the Group and perhaps delete from the db.
   */
  async removeMember(userId) {
    try {
      const group = new Group(this.data.group)
      await group.removeMember(userId)
      await group.update()
      // Don't leave orphaned invitees in the db.
      const member = new User(userId)
      const memberData = await member.getSelf()
      if (memberData?.inviteCode) member.delete()
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
 * const newMetadata = [{ label: 'Description', value: 'Updated description' }];
 * await instance.updateMetadata(newMetadata);
 * console.log(instance.data.metadata); // Outputs: { title: 'New Title', description: 'Updated description' }
 *
 * @throws {Error} Throws an error if the update operation fails.
 */

  async updateTools(selectedValues) {
    // Guard invalid input
    if (!Array.isArray(selectedValues)) return
    if (!this?.data?.tools) await this.#load()
    // Guard existing data in corrupted state
    if (!this.data?.tools) this.data.tools = []
    
    this.data.tools = this.data.tools.map(tool => {
      const match = selectedValues.find(t => {
        if (isNotValidValue(t.toolName)) 
          throw new Error("Invalid toolName")
        return t.toolName === tool.toolName})
      return {
        ...tool,
        custom: {
          ...tool.custom,
          enabled: match ? match.enabled : tool.custom.enabled
        }
      }
    })    
  
    return await this.update()
  }  

  async addTools(tools) {

    // Guard invalid input
    if (!Array.isArray(tools)) return
    if (!this?.data?.tools) await this.#load()
    // Guard existing data in corrupted state
    if (!this.data?.tools) this.data.tools = []

    for (let newTool of tools) {
      const name = newTool.name.trim()
      const value = newTool.value.trim()
      const url = newTool.url.trim()
      const state = newTool.state

      const containsCode = isNotValidName(name) || isNotValidValue(value)
      if (containsCode) 
        throw new Error("Invalid name or value")

      const isDuplicate = this.data.tools.some(
        tool => tool.name === name || tool.url === url
      )

      if (isDuplicate) {
        continue
      }

      this.data.tools.push({ name, value, url, state })
    }
    return await this.update()
  }

  async removeTool(toolValue) {
    if (!this?.data?.tools) await this.#load()
    if (!this.data?.tools) throw new Error("Project does not have tools.")

    const toolIndex = this.data.tools.findIndex(tool => tool.value === toolValue)
    if (toolIndex < 0) {
      throw new Error("Tool not found in project.")
    }

    this.data.tools.splice(toolIndex, 1)
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

  async updateLayer(layer, previousId) {
    if (!this.data?.layers) await this.#load()
    if (!this.data?.layers) throw new Error("Project does not have layers.")
    previousId ??= layer.id
    const layerIndex = this.data.layers.findIndex(l => l.id.split('/').pop() === previousId.split('/').pop())
    if (layerIndex < 0) {
      throw new Error("Layer not found in project.")
    }
    if (!isValidLayer(layer)) {
      throw new Error("Layer data is invalid.")
    }
    this.data.layers[layerIndex] = layer
    return this
  }

  addLayer(layer) {
    if (!this.data?.layers) {
      throw new Error("Project does not have layers.")
    }
    if (!isValidLayer(layer)) {
      throw new Error("Layer data is invalid.")
    }
    if (this.data.layers.findIndex(l => l.id.split('/').pop() === layer.id.split('/').pop()) >= 0) {
      throw new Error("Layer with this ID already exists in the project.")
    }
    const existingLayerLabelCount = this.data.layers.find(l => l.label === layer.label)?.length
    if (existingLayerLabelCount >= 0) {
      layer.label+=`(${existingLayerLabelCount + 2})`
    }
    this.data.layers.push(layer)
    return this
  }
}

function isValidLayer(layer) {
  if (typeof layer?.label !== 'string' || !layer?.id?.startsWith('http') || !Array.isArray(layer?.pages)) {
    return false
  }

  for (const page of layer.pages) {
    if (!page?.id?.startsWith('http') || !page?.target?.startsWith('http') || !page.label) {
      return false
    }
  }

  return true
}
