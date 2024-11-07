import express from "express"
import { validateID, respondWithError } from "../utilities/shared.mjs"
import cors from "cors"
import common_cors from "../utilities/common_cors.json" assert {type: "json"}
import auth0Middleware from "../auth/index.mjs"
import ProjectFactory from "../classes/Project/ProjectFactory.mjs"
import validateURL from "../utilities/validateURL.mjs"
import Project from "../classes/Project/Project.mjs"
import getHash from "../utilities/getHash.mjs"
import { isValidEmail } from "../utilities/validateEmail.mjs"
import { ACTIONS, ENTITIES, SCOPES } from "./groups/permissions_parameters.mjs"
import Group from "../classes/Group/Group.mjs"
import isDefaultRole from "../utilities/isDefaultRole.mjs"

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
  .all((req, res) => {
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
          getHash(user?.agent)
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
        const projectObj = await new Project(id)
        const accessInfo = await projectObj.checkUserAccess(user._id, ACTIONS.READ, SCOPES.ALL, ENTITIES.PROJECT)
        const project = await ProjectFactory.forInterface(projectObj.data)
        if (!project) {
          return respondWithError(res, 404, `No TPEN3 project with ID '${id}' found`)
        } else if (!accessInfo.hasAccess) {
          return respondWithError(res, 401, accessInfo.message)
        }

        if (accessInfo.hasAccess) {
          res.status(200).json(project)
        } else {
          respondWithError(res, 403, accessInfo.message)
        }

      } catch (error) {
        return respondWithError(
          res,
          error.status || error.code || 500,
          error.message ?? "An error occurred while fetching the project data."
        )
      }
    })()
  })
  .all((req, res) => {
    respondWithError(res, 405, "Improper request method. Use GET instead")
  })

router
  .route("/:id/invite-member")
  .post(auth0Middleware(), async (req, res) => {
    const user = req.user
    const { id: projectId } = req.params
    const { email, roles } = req.body

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
      const project = await new Project(projectId)

      const accessInfo = project.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.ALL, ENTITIES.MEMBER)
      if (accessInfo.hasAccess) {
        const response = await project.sendInvite(email, roles)
        res.status(200).json(response)
      } else {
        res
          .status(403)
          .send(accessInfo.message)
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
    const project = await new Project(projectId)
    const accessInfo = project.checkUserAccess(user._id, ACTIONS.DELETE, SCOPES.ALL, ENTITIES.MEMBER)

    if (
      accessInfo.hasAccess
    ) {
      const response = await project.removeMember(userId)
      res.sendStatus(204)
    } else {
      res
        .status(403)
        .send(accessInfo.message)
    }
  } catch (error) {
    res.status(error.status || 500).send(error.message.toString())
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
    const projectObj = await new Project(projectId)
    const accessInfo = await projectObj.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.ALL, ENTITIES.MEMBER)

    if (!accessInfo.hasAccess) return respondWithError(res, 403, accessInfo.message)

    const groupId = projectObj.data.group
    const group = new Group(groupId)
    await group.addMemberRoles(collaboratorId, roles)
    await group.update()

    res.status(200).send(`Roles added to member ${collaboratorId}.`)
  } catch (error) {
    return respondWithError(res, error.status || 500, error.message || "Error adding roles to member.")
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
    group.setMemberRoles(collaboratorId, roles)

    res.status(200).send(`Roles [${roles}] updated for member ${collaboratorId}.`)
  } catch (error) {
    return respondWithError(res, error.status || 500, error.message || "Error updating member roles.")
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
    return respondWithError(res, error.status || 500, error.message || "Error removing roles from member.")
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
    await group.addMemberRoles(newOwnerId, ["OWNER"])
    await group.removeMemberRoles(user._id, ["OWNER"])

    res.status(200).json({ message: `Ownership successfully transferred to member ${newOwnerId}.` })
  } catch (error) {
    return respondWithError(res, error.status || 500, error.message || "Error transferring ownership.")
  }
})


// Manage Custom Roles Endpoints

// Add custom roles to a project
router.post('/:projectId/addRoles', auth0Middleware(), async (req, res) => {
  const { projectId } = req.params
  const customRoles = req.body.roles ?? req.body
  const user = req.user

  if (!user) {
    return res.status(401).json({ message: 'Unauthenticated request' })
  }

  if (!Object.keys(customRoles).length) {
    return respondWithError(res, 400, "Custom roles must be provided as a JSON Object with keys as roles and values as arrays of permissions or space-delimited strings.")
  }

  // Make sure provided role is not a DEFAULT role
  const [isDefault, defaultRole] = isDefaultRole(customRoles)
  if (isDefault) return respondWithError(res, 400, `Cannot remove default role: ${defaultRole} `)


  try {
    const project = await new Project(projectId)
    const accessInfo = await project.checkUserAccess(user._id, ACTIONS.CREATE, SCOPES.ALL, ENTITIES.ROLE)

    if (!accessInfo.hasAccess) {
      return res.status(403).json({ message: accessInfo.message })
    }

    const groupId = project.data.group
    const group = new Group(groupId)
    await group.addCustomRoles(customRoles)

    res.status(201).json({ message: 'Custom roles added successfully.' })

  } catch (error) {
    respondWithError(res, error.status ?? 500, 'Error adding custom roles.')
  }
})


router.put('/:projectId/setRoles', auth0Middleware(), async (req, res) => {
  const { projectId } = req.params
  const newCustomRoles = req.body.roles ?? req.body
  const user = req.user

  if (!user) {
    return res.status(401).json({ message: 'Unauthenticated request' })
  }

  if (!Object.keys(newCustomRoles).length) {
    return respondWithError(res, 400, "Custom roles must be provided as a JSON Object with keys as roles and values as arrays of permissions or space-delimited strings.")
  }

  // Ensure none of the provided roles are default roles
  const [isDefault, defaultRole] = isDefaultRole(newCustomRoles)
  if (isDefault) return respondWithError(res, 400, `Cannot remove default role: ${defaultRole} `)


  try {
    const project = await new Project(projectId)
    const accessInfo = await project.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.ALL, ENTITIES.ROLE)

    if (!accessInfo.hasAccess) {
      return res.status(403).json({ message: accessInfo.message })
    }

    const groupId = project.data.group
    const group = new Group(groupId)
    await group.setCustomRoles(newCustomRoles)

    res.status(200).json({ message: 'Custom roles set successfully.' })
  } catch (error) {
    respondWithError(res, error.status ?? 500, 'Error setting custom roles.')
  }
})



router.post('/:projectId/removeRoles', auth0Middleware(), async (req, res) => {
  const { projectId } = req.params
  const rolesToRemove = req.body.roles ?? req.body
  const user = req.user
  if (!user) {
    return res.status(401).json({ message: 'Unauthenticated request' })
  }

  if (!Object.keys(rolesToRemove).length && !rolesToRemove.length) {
    return respondWithError(res, 400, "Roles to remove must be provided as an array of strings or a JSON Object with keys as roles and values as arrays of permissions or space-delimited strings.")
  }

  // Ensure no default roles are being removed
  const [isDefault, defaultRole] = isDefaultRole(rolesToRemove)
  if (isDefault) return respondWithError(res, 400, `Cannot remove default role: ${defaultRole} `)

  try {
    const project = await new Project(projectId)
    const accessInfo = await project.checkUserAccess(user._id, ACTIONS.DELETE, SCOPES.ALL, ENTITIES.ROLE)

    if (!accessInfo.hasAccess) {
      return res.status(403).json({ message: accessInfo.message })
    }

    const groupId = project.data.group
    const group = new Group(groupId)
    await group.removeCustomRoles(rolesToRemove)
    // await group.removeCustomRoles(Object.fromEntries(rolesToRemove.map(role => [role, []])))

    res.status(200).json({ message: 'Custom roles removed successfully.' })
  } catch (error) {
    console.log(error)
    respondWithError(res, error.status ?? 500, 'Error removing custom roles.')
  }
})





















// // Set or update custom roles in a project
// router.put('/:projectId/setRoles', auth0Middleware(), async (req, res) => {
//   const { projectId } = req.params
//   const customRoles = req.body // Assuming the format is a complete role map

//   try {
//     const project = await new Project(projectId)
//     const user = req.user

//     if (!user) {
//       return res.status(401).json({ message: 'Unauthenticated request' })
//     }

//     // Check user access for managing roles
//     const accessInfo = await project.checkUserAccess(user._id, 'UPDATE', 'ALL', 'ROLE')
//     if (!accessInfo.hasAccess) {
//       return res.status(403).json({ message: accessInfo.message })
//     }

//     const groupId = project.data.group
//     const group = new Group(groupId)

//     // Validate and set custom roles
//     for (const roleName of Object.keys(customRoles)) {
//       if (isDefaultRole(roleName)) {
//         return res.status(400).json({ message: `Cannot modify default role: ${roleName}` })
//       }
//     }

//     await group.setCustomRoles(customRoles)
//     res.status(200).json({ message: 'Custom roles updated successfully.' })

//   } catch (error) {
//     res.status(error.status || 500).json({ message: error.message || 'Error setting custom roles.' })
//   }
// })

// // POST /project/:id/removeRoles - Remove custom roles from a project
// router.post('/:projectId/removeRoles', auth0Middleware(), async (req, res) => {
//   const { projectId } = req.params
//   const rolesToRemove = req.body // Assuming format: { roleName: [] }

//   try {
//     const project = await new Project(projectId)
//     const user = req.user

//     if (!user) {
//       return res.status(401).json({ message: 'Unauthenticated request' })
//     }

//     // Check user access for managing roles
//     const accessInfo = await project.checkUserAccess(user._id, 'DELETE', 'ALL', 'ROLE')
//     if (!accessInfo.hasAccess) {
//       return res.status(403).json({ message: accessInfo.message })
//     }

//     const groupId = project.data.group
//     const group = new Group(groupId)

//     // Validate roles to remove
//     for (const roleName of Object.keys(rolesToRemove)) {
//       if (isDefaultRole(roleName)) {
//         return res.status(400).json({ message: `Cannot remove default role: ${roleName}` })
//       }
//     }

//     await group.removeCustomRoles(rolesToRemove)
//     res.status(204).send()

//   } catch (error) {
//     res.status(error.status || 500).json({ message: error.message || 'Error removing custom roles.' })
//   }
// })

export default router
