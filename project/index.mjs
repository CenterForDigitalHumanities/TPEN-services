import express from "express"
import { validateID, respondWithError } from "../utilities/shared.mjs"
import cors from "cors"
import common_cors from "../utilities/common_cors.json" with {type: "json"}
import auth0Middleware from "../auth/index.mjs"
import ProjectFactory from "../classes/Project/ProjectFactory.mjs"
import validateURL from "../utilities/validateURL.mjs"
import Project from "../classes/Project/Project.mjs"
import Layer from "../classes/Layer/Layer.mjs"
import { isValidEmail } from "../utilities/validateEmail.mjs"
import { ACTIONS, ENTITIES, SCOPES } from "./groups/permissions_parameters.mjs"
import Group from "../classes/Group/Group.mjs"
import scrubDefaultRoles from "../utilities/isDefaultRole.mjs"
import Hotkeys from "../classes/HotKeys/Hotkeys.js"
import path from "path"
import fs from "fs"

let router = express.Router()
router.use(cors(common_cors))

router
  .route("/create")
  .post(auth0Middleware(), async (req, res) => {
    const user = req.user

    if (!user?.agent) return respondWithError(res, 401, "Unauthenticated user")

    const projectObj = new Project()

    let project = req.body
    project = { ...project, creator: user?.agent }

    try {
      const newProject = await projectObj.create(project)

      res.setHeader("Location", newProject?._id)
      res.status(201).json(newProject)
    } catch (error) {
      respondWithError(
        res,

        error.status ?? error.code ?? 500,
        error.message ?? "Unknown server error"
      )
    }
  })
  .all((_, res) => {
    respondWithError(res, 405, "Improper request method. Use POST instead")
  })

router
  .route("/import")
  .post(auth0Middleware(), async (req, res) => {
    let { createFrom } = req.query
    let user = req.user
    createFrom = createFrom?.toLowerCase()
    if (!createFrom)
      return res.status(400).json({
        message:
          "Query string 'createFrom' is required, specify manifest source as 'URL' or 'DOC' "
      })

    if (createFrom === "url") {
      const manifestURL = req?.body?.url

      let checkURL = await validateURL(manifestURL)

      if (!checkURL.valid)
        return res.status(checkURL.status).json({
          message: checkURL.message,
          resolvedPayload: checkURL.resolvedPayload
        })

      try {
        const result = await ProjectFactory.fromManifestURL(
          manifestURL,
          user._id
        )
        res.status(201).json(result)
      } catch (error) {
        res.status(error.status ?? 500).json({
          status: error.status ?? 500,
          message: error.message,
          data: error.resolvedPayload
        })
      }
    } else {
      res.status(400).json({
        message: `Import from ${createFrom} is not available. Create from URL instead`
      })
    }
  })
  .all((req, res) => {
    respondWithError(res, 405, "Improper request method. Use POST instead")
  })

router
  .route("/:id/manifest")
  .get(auth0Middleware(), async (req, res) => {
    const {id} = req.params
    const user = req.user

    if (!id) {
      return respondWithError(res, 400, "No TPEN3 ID provided")
    } else if (!validateID(id)) {
      return respondWithError(res, 400, "The TPEN3 project ID provided is invalid")
    }
    
    try {
      const project = await ProjectFactory.loadAsUser(id, null)
      const collaboratorIdList = []

      Object.entries(project.collaborators).map(([id, data]) => {
        collaboratorIdList.push(id)
      })
      
      if (!collaboratorIdList.includes(user._id)) {
        return respondWithError(res, 403, "You do not have permission to export this project")
      }
      if (!await new Project(id).checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.ALL, ENTITIES.PROJECT)) {
        return respondWithError(res, 403, "You do not have permission to export this project")
      }
      const manifest = await ProjectFactory.exportManifest(id)
      const folderPath = path.join(`./${id}`)
      const files = fs.readdirSync(folderPath)
      for (const file of files) {
          const filePath = path.join(folderPath, file)
          if (fs.lstatSync(filePath).isFile()) {
              await ProjectFactory.uploadFileToGitHub(filePath, `${id}`)
          }
      }
      fs.rmSync(folderPath, {recursive: true, force: true})
      res.status(200).json(manifest)
    } catch (error) {
      return respondWithError(
        res,
        error.status || error.code || 500,
        error.message ?? "An error occurred while fetching the project data."
      )
    }
  })
  .all((_, res) => {
    respondWithError(res, 405, "Improper request method. Use GET instead")
  })

router
  .route("/:id")
  .get(auth0Middleware(), async (req, res) => {
    const user = req.user
    let id = req.params.id

    if (!id) {
      return respondWithError(res, 400, "No TPEN3 ID provided")
    } else if (!validateID(id)) {
      return respondWithError(res, 400, "The TPEN3 project ID provided is invalid")
    }

    (async () => {
      try {
        const project = await ProjectFactory.loadAsUser(id, user._id)
        if (!project) {
          return respondWithError(res, 404, `No TPEN3 project with ID '${id}' found`)
        }
        res.status(200).json(project)
      } catch (error) {
        return respondWithError(
          res,
          error.status || error.code || 500,
          error.message ?? "An error occurred while fetching the project data."
        )
      }
    })()
  })
  .all((_, res) => {
    respondWithError(res, 405, "Improper request method. Use GET instead")
  })

router
  .route("/:id/invite-member")
  .post(auth0Middleware(), async (req, res) => {
    const user = req.user
    const { id: projectId } = req.params
    const { email, roles } = req.body
    // roles is set to ["CONTRIBUTOR"] if undefined within Project.sendInvite() > parseRoles()

    if (!user) {
      return respondWithError(res, 401, "Unauthenticated request")
    } else if (!email) {
      return respondWithError(
        res,
        400,
        "Invitee's email is required"
      )
    } else if (!isValidEmail(email)) {
      return respondWithError(res, 400, "Invitee email is invalid")
    }
    try {
      const project = new Project(projectId)
      if (await project.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.ALL, ENTITIES.MEMBER)) {
        const response = await project.sendInvite(email, roles)
        res.status(200).json(response)
      } else {
        res
          .status(403)
          .send("You do not have permission to invite members to this project")
      }
    } catch (error) {
      res.status(error.status || 500).send(error.message.toString())
    }
  })

router.route("/:id/remove-member").post(auth0Middleware(), async (req, res) => {
  const user = req.user
  const { id: projectId } = req.params
  const { userId } = req.body

  if (!user) {
    return respondWithError(res, 401, "Unauthenticated request")
  }
  else if (!projectId) {
    return respondWithError(res, 400, "Project ID is required")
  }
  else if (!userId) {
    return respondWithError(res, 400, "User ID is required")
  }

  try {
    const project = new Project(projectId)
    if (await project.checkUserAccess(user._id, ACTIONS.DELETE, SCOPES.ALL, ENTITIES.MEMBER)) {
      await project.removeMember(userId)
        .then(() => res.sendStatus(204))
    }
    else {
      res
        .status(403)
        .send("You do not have permission to remove members from this project")
    }
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message ?? "Error removing member from project.")
  }
})

// Add New Role to Member
router.route("/:projectId/collaborator/:collaboratorId/addRoles").post(auth0Middleware(), async (req, res) => {
  const { projectId, collaboratorId } = req.params
  const roles = req.body.roles ?? req.body
  const user = req.user
  if (!user) {
    return respondWithError(res, 401, "Unauthenticated request")
  }
  if (!roles) {
    return respondWithError(res, 400, "Provide role(s) to add")
  }
  try {
    const projectObj = new Project(projectId)

    if (!(await projectObj.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.ALL, ENTITIES.MEMBER))) {
      return respondWithError(res, 403, "You do not have permission to add roles to members.")
    }

    const groupId = projectObj.data.group
    const group = new Group(groupId)
    await group.addMemberRoles(collaboratorId, roles)
    await group.update()

    res.status(200).send(`Roles added to member ${collaboratorId}.`)
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message ?? "Error adding roles to member.")
  }
})

// Change a member's Role(s): Replace roles with new ones
router.route("/:projectId/collaborator/:collaboratorId/setRoles").put(auth0Middleware(), async (req, res) => {
  const { projectId, collaboratorId } = req.params
  const roles = req.body.roles ?? req.body
  const user = req.user
  if (!user) {
    return respondWithError(res, 401, "Unauthenticated request")
  }

  if (!roles) {
    return respondWithError(res, 400, "Provide role(s) to update")
  }


  try {
    const projectObj = new Project(projectId)

    if (!(await projectObj.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.ALL, ENTITIES.MEMBER))) {
      return respondWithError(res, 403, "You do not have permission to update member roles.")
    }

    const group = new Group(projectObj.data.group)
    await group.setMemberRoles(collaboratorId, roles)

    res.status(200).send(`Roles [${roles}] updated for member ${collaboratorId}.`)
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message ?? "Error updating member roles.")
  }
})


// Remove a Role from Member
router.route("/:projectId/collaborator/:collaboratorId/removeRoles").post(auth0Middleware(), async (req, res) => {
  const { projectId, collaboratorId } = req.params
  const roles = req.body.roles ?? req.body
  const user = req.user
  if (!user) {
    return respondWithError(res, 401, "Unauthenticated request")
  }
  if (!roles) {
    return respondWithError(res, 400, "Provide role(s) to remove")
  }
  if (roles.includes("OWNER")) {
    return respondWithError(res, 400, "The OWNER role cannot be removed.")
  }
  try {
    const projectObj = new Project(projectId)

    if (!(await projectObj.checkUserAccess(user._id, ACTIONS.DELETE, SCOPES.ALL, ENTITIES.MEMBER))) {
      return respondWithError(res, 403, "You do not have permission to remove roles from members.")
    }

    const group = new Group(projectObj.data.group)
    await group.removeMemberRoles(collaboratorId, roles)

    res.status(204).send(`Roles [${roles}] removed from member ${collaboratorId}.`)

  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message ?? "Error removing roles from member.")
  }
})


// Switch project owner

router.route("/:projectId/switch/owner").post(auth0Middleware(), async (req, res) => {
  const { projectId } = req.params
  const { newOwnerId } = req.body
  const user = req.user

  if (!user) {
    return respondWithError(res, 401, "Unauthenticated request")
  }
  if (!newOwnerId) {
    return respondWithError(res, 400, "Provide the ID of the new owner.")
  }
  if (user._id === newOwnerId) {
    return respondWithError(res, 400, "Cannot transfer ownership to the current owner.")
  }

  try {
    const projectObj = new Project(projectId)

    if (!(await projectObj.checkUserAccess(user._id, ACTIONS.ALL, SCOPES.ALL, ENTITIES.ALL))) {
      return respondWithError(res, 403, "You do not have permission to transfer ownership.")
    }

    const group = new Group(projectObj.data.group)
    if (user._id === newOwnerId) {
      return respondWithError(res, 400, "Cannot transfer ownership to the current owner.")
    }

    const currentRoles = await group.getMemberRoles(user._id)
    // If user only has the OWNER role, we default them to CONTRIBUTOR before transferring ownership
    Object.keys(currentRoles).length === 1 && await group.addMemberRoles(user._id, ["CONTRIBUTOR"])
    group.addMemberRoles(newOwnerId, ["OWNER"], true)
    group.removeMemberRoles(user._id, ["OWNER"], true)
    await group.update()

    res.status(200).json({ message: `Ownership successfully transferred to member ${newOwnerId}.` })
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message ?? "Error transferring ownership.")
  }
})


// Manage Custom Roles Endpoints

// Add custom roles to a project
router.post('/:projectId/addCustomRoles', auth0Middleware(), async (req, res) => {
  const { projectId } = req.params
  let customRoles = req.body.roles ?? req.body
  const user = req.user

  if (!user) {
    return respondWithError(res, 401, "Unauthenticated request")
  }

  if (!Object.keys(customRoles).length) {
    return respondWithError(res, 400, "Custom roles must be provided as a JSON Object with keys as roles and values as arrays of permissions or space-delimited strings.")
  }

  try {
    // Make sure provided role is not a DEFAULT role
    customRoles = scrubDefaultRoles(customRoles)
    if (!customRoles) return respondWithError(res, 400, `No custom roles provided.`)

    const project = new Project(projectId)
    if (!(await project.checkUserAccess(user._id, ACTIONS.CREATE, SCOPES.ALL, ENTITIES.ROLE))) {
      return respondWithError(res, 403, "You do not have permission to add custom roles.")
    }

    const group = new Group(project.data.group)
    await group.addCustomRoles(customRoles)

    res.status(201).json({ message: 'Custom roles added successfully.' })

  } catch (error) {
    respondWithError(res, error.status ?? 500, error.message ?? 'Error adding custom roles.')
  }
})


router.put('/:projectId/setCustomRoles', auth0Middleware(), async (req, res) => {
  const { projectId } = req.params
  let newCustomRoles = req.body.roles ?? req.body
  const user = req.user

  if (!user) {
    return respondWithError(res, 401, "Unauthenticated request")
  }

  if (!Object.keys(newCustomRoles).length) {
    return respondWithError(res, 400, "Custom roles must be provided as a JSON Object with keys as roles and values as arrays of permissions or space-delimited strings.")
  }

  try {
    // Ensure none of the provided roles are default roles
    newCustomRoles = scrubDefaultRoles(newCustomRoles)
    if (!newCustomRoles) return respondWithError(res, 400, `No custom roles provided.`)

    const project = new Project(projectId)

    if (!(await project.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.ALL, ENTITIES.ROLE))) {
      return respondWithError(res, 403, "You do not have permission to set custom roles.")
    }

    const group = new Group(project.data.group)
    await group.setCustomRoles(newCustomRoles)

    res.status(200).json({ message: 'Custom roles set successfully.' })
  } catch (error) {
    respondWithError(res, error.status ?? 500, error.message ?? 'Error setting custom roles.')
  }
})



router.post('/:projectId/removeCustomRoles', auth0Middleware(), async (req, res) => {
  const { projectId } = req.params
  let rolesToRemove = req.body.roles ?? req.body
  const user = req.user
  if (!user) {
    return respondWithError(res, 401, "Unauthenticated request")
  }
  if (typeof rolesToRemove === 'object' && !Array.isArray(rolesToRemove)) {
    rolesToRemove = Object.keys(rolesToRemove)
  }
  if (typeof rolesToRemove === 'string') {
    rolesToRemove = rolesToRemove.split(' ')
  }
  if (!rolesToRemove.length) {
    return respondWithError(res, 400, "Roles to remove must be provided as an array of strings or a JSON Object with keys as roles and values as arrays of permissions or space-delimited strings.")
  }

  try {
    // Ensure no default roles are being removed
    rolesToRemove = scrubDefaultRoles(rolesToRemove)
    if (!rolesToRemove) {
      return respondWithError(res, 400, `No custom roles provided.`)
    }
    const project = new Project(projectId)
    if (!(await project.checkUserAccess(user._id, ACTIONS.DELETE, SCOPES.ALL, ENTITIES.ROLE))) {
      return respondWithError(res, 403, "You do not have permission to remove custom roles.")
    }

    const group = new Group(project.data.group)
    await (await group.removeCustomRoles(rolesToRemove)).update()

    res.status(200).json({ message: 'Custom roles removed successfully.' })
  } catch (error) {
    console.log(error)
    respondWithError(res, error.status ?? 500, error.message ?? 'Error removing custom roles.')
  }
})

// Add a New Layer
router.route("/:projectId/layer").post(auth0Middleware(), async (req, res) => {
  const { projectId } = req.params
  const labelAndCanvases = req.body
  const user = req.user
  if (!user) {
    return respondWithError(res, 401, "Unauthenticated request")
  }

  if (!projectId) {
    return respondWithError(res, 400, "Project ID is required")
  }

  if(!validateID(projectId)){
    return respondWithError(res, 400, "Invalid project ID provided.")
  }

  if (!labelAndCanvases || !labelAndCanvases.canvases) {
    return respondWithError(res, 400, "Invalid layer provided. Expected a layer object.")
  }

  try {
    const project = new Project(projectId)

    if(!project || await project.loadProject() === null) {
      return respondWithError(res, 404, "Project does not exist.")
    }

    const layers = (await project.loadProject())

    if (!(await project.checkUserAccess(user._id, ACTIONS.CREATE, SCOPES.ALL, ENTITIES.LAYER))) {
      return respondWithError(res, 403, "You do not have permission to add layers to this project.")
    }

    const layer = new Layer(layers)
    const response = await layer.addLayer(projectId, labelAndCanvases, project.getLabel())
    res.status(201).json(response)
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message ?? "Error adding layer to project.")      
  }
})

// Delete a Layer
router.route("/:projectId/layer/:layerId").delete(auth0Middleware(), async (req, res) => {
  const { projectId, layerId } = req.params
  const user = req.user
  if (!user) {
    return respondWithError(res, 401, "Unauthenticated request")
  }

  if (!projectId) {
    return respondWithError(res, 400, "Project ID is required")
  }

  if(!validateID(projectId)){
    return respondWithError(res, 400, "Invalid project ID provided.")
  }

  if (!layerId) {
    return respondWithError(res, 400, "Layer ID is required")
  }

  try {
    const project = new Project(projectId)

    if(!project || await project.loadProject() === null) {
      return respondWithError(res, 404, "Project does not exist.")
    }

    const layers = (await project.loadProject())
    
    if (!(await project.checkUserAccess(user._id, ACTIONS.DELETE, SCOPES.ALL, ENTITIES.LAYER))) {
      return respondWithError(res, 403, "You do not have permission to delete layers from this project.")
    }

    const layer = new Layer(layers)
    if (layer.data.layers.find(layer => String(layer.id).split("/").pop() === `${layerId}`) === undefined) {
      return respondWithError(res, 400, "Layer not found in project.")
    }
    
    const response = await layer.deleteLayer(projectId, layerId)
    res.status(204).json(response)
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message ?? "Error deleting layer from project.")
  }
})

// Update Project Metadata
router.route("/:projectId/metadata").put(auth0Middleware(), async (req, res) => {
  const { projectId } = req.params
  const metadata = req.body
  const user = req.user
  if (!user) {
    return respondWithError(res, 401, "Unauthenticated request")
  }

  if (!metadata || !Array.isArray(metadata)) {
    return respondWithError(res, 400, "Invalid metadata provided. Expected an array of objects with 'label' and 'value'.")
  }

  try {
    const projectObj = new Project(projectId)

    if (!(await projectObj.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.METADATA, ENTITIES.PROJECT))) {
      return respondWithError(res, 403, "You do not have permission to update metadata for this project.")
    }

    const response = await projectObj.updateMetadata(metadata)
    res.status(200).json(response)
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message ?? "Error updating project metadata.")
  }
})


// Change a member's Role(s): Replace roles with new ones
router.route("/:projectId/collaborator/:collaboratorId/setRoles").put(auth0Middleware(), async (req, res) => {
  const { projectId, collaboratorId } = req.params
  const roles = req.body.roles ?? req.body
  const user = req.user
  if (!user) {
    return respondWithError(res, 401, "Unauthenticated request")
  }

  if (!roles) {
    return respondWithError(res, 400, "Provide role(s) to update")
  }


  try {
    const projectObj = await new Project(projectId)
    const accessInfo = await projectObj.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.ALL, ENTITIES.MEMBER)

    if (!accessInfo.hasAccess) return respondWithError(res, 403, accessInfo.message)

    const groupId = projectObj.data.group
    const group = new Group(groupId)
    await group.setMemberRoles(collaboratorId, roles)

    res.status(200).send(`Roles [${roles}] updated for member ${collaboratorId}.`)
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message ?? "Error updating member roles.")
  }
})


// Remove a Role from Member
router.route("/:projectId/collaborator/:collaboratorId/removeRoles").post(auth0Middleware(), async (req, res) => {
  const { projectId, collaboratorId } = req.params
  const roles = req.body.roles ?? req.body
  const user = req.user
  if (!user) {
    return respondWithError(res, 401, "Unauthenticated request")
  }
  if (!roles) {
    return respondWithError(res, 400, "Provide role(s) to remove")
  }
  if (roles.includes("OWNER")) {
    return respondWithError(res, 400, "The OWNER role cannot be removed.")
  }
  try {
    const projectObj = await new Project(projectId)
    const accessInfo = await projectObj.checkUserAccess(user._id, ACTIONS.DELETE, SCOPES.ALL, ENTITIES.MEMBER)

    if (!accessInfo.hasAccess) return respondWithError(res, 403, accessInfo.message)

    const groupId = projectObj.data.group
    const group = new Group(groupId)
    await group.removeMemberRoles(collaboratorId, roles)

    res.status(204).send(`Roles [${roles}] removed from member ${collaboratorId}.`)

  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message ?? "Error removing roles from member.")
  }
})


// Switch project owner

router.route("/:projectId/switch/owner").post(auth0Middleware(), async (req, res) => {
  const { projectId } = req.params
  const { newOwnerId } = req.body
  const user = req.user

  if (!user) {
    return respondWithError(res, 401, "Unauthenticated request")
  }
  if (!newOwnerId) {
    return respondWithError(res, 400, "Provide the ID of the new owner.")
  }

  try {
    const projectObj = await new Project(projectId)

    const accessInfo = await projectObj.checkUserAccess(user._id, ACTIONS.ALL, SCOPES.ALL, ENTITIES.ALL)
    if (!accessInfo.hasAccess) return respondWithError(res, 403, "Only the current owner can transfer ownership.")

    const groupId = projectObj.data.group
    const group = new Group(groupId)

    if (user._id === newOwnerId) {
      return respondWithError(res, 400, "Cannot transfer ownership to the current owner.")
    }

    const currentRoles = await group.getMemberRoles(user._id)
    // If user only has the OWNER role, we default them to CONTRIBUTOR before transferring ownership
    Object.keys(currentRoles).length === 1 && await group.addMemberRoles(user._id, ["CONTRIBUTOR"])
    await group.addMemberRoles(newOwnerId, ["OWNER"], true)
    await group.removeMemberRoles(user._id, ["OWNER"], true)

    res.status(200).json({ message: `Ownership successfully transferred to member ${newOwnerId}.` })
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message ?? "Error transferring ownership.")
  }
})


// Manage Custom Roles Endpoints

// Add custom roles to a project
router.post('/:projectId/addCustomRoles', auth0Middleware(), async (req, res) => {
  const { projectId } = req.params
  let customRoles = req.body.roles ?? req.body
  const user = req.user

  if (!user) {
    return respondWithError(res, 401, "Unauthenticated request")
  }

  if (!Object.keys(customRoles).length) {
    return respondWithError(res, 400, "Custom roles must be provided as a JSON Object with keys as roles and values as arrays of permissions or space-delimited strings.")
  }

  try {
    // Make sure provided role is not a DEFAULT role
    customRoles = scrubDefaultRoles(customRoles)
    if (!customRoles) return respondWithError(res, 400, `No custom roles provided.`)


    const project = await new Project(projectId)
    const accessInfo = await project.checkUserAccess(user._id, ACTIONS.CREATE, SCOPES.ALL, ENTITIES.ROLE)

    if (!accessInfo.hasAccess) {
      return respondWithError(res, 403, accessInfo.message)
    }

    const groupId = project.data.group
    const group = new Group(groupId)
    await group.addCustomRoles(customRoles)

    res.status(201).json({ message: 'Custom roles added successfully.' })

  } catch (error) {
    respondWithError(res, error.status ?? 500, error.message ?? 'Error adding custom roles.')
  }
})


router.put('/:projectId/setCustomRoles', auth0Middleware(), async (req, res) => {
  const { projectId } = req.params
  let newCustomRoles = req.body.roles ?? req.body
  const user = req.user

  if (!user) {
    return respondWithError(res, 401, "Unauthenticated request")
  }

  if (!Object.keys(newCustomRoles).length) {
    return respondWithError(res, 400, "Custom roles must be provided as a JSON Object with keys as roles and values as arrays of permissions or space-delimited strings.")
  }

  try {
    // Ensure none of the provided roles are default roles
    newCustomRoles = scrubDefaultRoles(newCustomRoles)
    if (!newCustomRoles) return respondWithError(res, 400, `No custom roles provided.`)


    const project = await new Project(projectId)
    const accessInfo = await project.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.ALL, ENTITIES.ROLE)

    if (!accessInfo.hasAccess) {
      return respondWithError(res, 403, accessInfo.message)
    }

    const groupId = project.data.group
    const group = new Group(groupId)
    await group.setCustomRoles(newCustomRoles)

    res.status(200).json({ message: 'Custom roles set successfully.' })
  } catch (error) {
    respondWithError(res, error.status ?? 500, error.message ?? 'Error setting custom roles.')
  }
})



router.post('/:projectId/removeCustomRoles', auth0Middleware(), async (req, res) => {
  const { projectId } = req.params
  let rolesToRemove = req.body.roles ?? req.body
  const user = req.user
  if (!user) {
    return respondWithError(res, 401, "Unauthenticated request")
  }

  if (typeof rolesToRemove === 'object' && !Array.isArray(rolesToRemove)) {
    rolesToRemove = Object.keys(rolesToRemove)
  }

  if (typeof rolesToRemove === 'string') {
    rolesToRemove = rolesToRemove.split(' ')
  }

  if (!rolesToRemove.length) {
    return respondWithError(res, 400, "Roles to remove must be provided as an array of strings or a JSON Object with keys as roles and values as arrays of permissions or space-delimited strings.")
  }

  try {
    // Ensure no default roles are being removed
    rolesToRemove = scrubDefaultRoles(rolesToRemove)
    if (!rolesToRemove) return respondWithError(res, 400, `No custom roles provided.`)

    const project = await new Project(projectId)
    const accessInfo = await project.checkUserAccess(user._id, ACTIONS.DELETE, SCOPES.ALL, ENTITIES.ROLE)

    if (!accessInfo.hasAccess) {
      return respondWithError(res, 403, accessInfo.message)
    }

    const groupId = project.data.group
    const group = new Group(groupId)
    await group.removeCustomRoles(rolesToRemove)

    res.status(200).json({ message: 'Custom roles removed successfully.' })
  } catch (error) {
    console.log(error)
    respondWithError(res, error.status ?? 500, error.message ?? 'Error removing custom roles.')
  }
})

// Create Hotkey
router.route("/:projectId/hotkeys").post(auth0Middleware(), async (req, res) => {
  const user = req.user
  const { projectId } = req.params
  const { symbols } = req.body

  if (!user) {
    return respondWithError(res, 401, "Unauthenticated request")
  }
  if (!symbols || symbols.length === 0) {
    return respondWithError(res, 400, "At least one symbol is required")
  }

  try {
    const project = new Project(projectId)
    if (await project.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.OPTIONS, ENTITIES.PROJECT)) {
      const hotkeys = new Hotkeys(projectId, symbols)
      const hotkey = await hotkeys.create()
      console.dir(hotkey)
      res.status(201).json(hotkey)
      return
    } 
    return respondWithError(res, 403, "You do not have permission to create hotkeys for this project")
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message.toString())
  }
})

// Update Hotkeys
router.route("/:projectId/hotkeys").put(auth0Middleware(), async (req, res) => {
  const user = req.user
  const { projectId } = req.params
  const { symbols } = req.body

  if (!user) {
    return respondWithError(res, 401, "Unauthenticated request")
  }
  if (!symbols || symbols.length === 0) {
    return respondWithError(res, 400, "At least one symbol is required")
  }
  if (!Array.isArray(symbols) || symbols.some(symbol => typeof symbol !== 'string')) {
    return respondWithError(res, 400, "All symbols must be strings")
  }

  try {
    const project = new Project(projectId)
    if (await project.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.OPTIONS, ENTITIES.PROJECT)) {
      const hotkeys = new Hotkeys(projectId, symbols)
      const hotkey = await hotkeys.setSymbols()
      res.status(200).json(hotkey)
      return
    }
    return respondWithError(res, 403, "You do not have permission to update hotkeys for this project")
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message.toString())
  }
})

// Delete Hotkeys
router.route("/:projectId/hotkeys").delete(auth0Middleware(), async (req, res) => {
  const user = req.user
  const { projectId } = req.params

  if (!user) {
    return respondWithError(res, 401, "Unauthenticated request")
  }

  try {
    const project = new Project(projectId)
    if (await project.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.OPTIONS, ENTITIES.PROJECT)) {
      const hotkeys = new Hotkeys(projectId)
      const isDeleted = await hotkeys.delete()
      res.status(200).json(isDeleted)
      return
    }
    return respondWithError(res, 403, "You do not have permission to delete hotkeys for this project")
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message.toString())
  }
})

// Get Hotkeys for a project
router.route("/:projectId/hotkeys").get(auth0Middleware(), async (req, res) => {
  const user = req.user
  const { projectId } = req.params

  if (!user) {
    return respondWithError(res, 401, "Unauthenticated request")
  }

  try {
    const project = new Project(projectId)
    if (await project.checkUserAccess(user._id, ACTIONS.READ, SCOPES.OPTIONS, ENTITIES.PROJECT)) {
      const H = await Hotkeys.getByProjectId(projectId)
      res.status(200).json(H.symbols)
      return
    }
    return respondWithError(res, 403, "You do not have permission to view hotkeys for this project")
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message.toString())
  }
})

router.route("/:projectId/hotkeys").all((_, res) => {
  respondWithError(res, 405, "Improper request method. Use GET, PUT, or DELETE instead")
})

export default router
