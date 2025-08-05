import express from "express"
import { respondWithError } from "../utilities/shared.js"
import auth0Middleware from "../auth/index.js"
import scrubDefaultRoles from "../utilities/isDefaultRole.js"
import Project from "../classes/Project/Project.js"
import Group from "../classes/Group/Group.js"
import { ACTIONS, ENTITIES, SCOPES } from "./groups/permissions_parameters.js"
import ProjectFactory from "../classes/Project/ProjectFactory.js"

const router = express.Router({ mergeParams: true })

// Add custom roles
router.post('/:projectId/addCustomRoles', auth0Middleware(), async (req, res) => {
  const { projectId } = req.params
  let customRoles = req.body.roles ?? req.body
  const user = req.user
  if (!user) return respondWithError(res, 401, "Unauthenticated request")
  if (!Object.keys(customRoles).length) {
    return respondWithError(res, 400, "Custom roles must be provided as a JSON Object with keys as roles and values as arrays of permissions or space-delimited strings.")
  }
  try {
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

// Set custom roles
router.put('/:projectId/setCustomRoles', auth0Middleware(), async (req, res) => {
  const { projectId } = req.params
  let roles = req.body.roles ?? req.body
  const user = req.user
  if (!user) return respondWithError(res, 401, "Unauthenticated request")
  if (!Object.keys(roles).length) {
    return respondWithError(res, 400, "Custom roles must be provided as a JSON Object with keys as roles and values as arrays of permissions or space-delimited strings.")
  }
  try {
    roles = scrubDefaultRoles(roles)
    if (!roles) return respondWithError(res, 400, `No custom roles provided.`)
    const project = new Project(projectId)
    if (!(await project.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.ALL, ENTITIES.ROLE))) {
      return respondWithError(res, 403, "You do not have permission to set custom roles.")
    }
    const group = new Group(project.data.group)
    await group.updateCustomRoles(roles)
    res.status(200).json({ message: 'Custom roles set successfully.' })
  } catch (error) {
    respondWithError(res, error.status ?? 500, error.message ?? 'Error setting custom roles.')
  }
})

// Remove custom roles
router.post('/:projectId/removeCustomRoles', auth0Middleware(), async (req, res) => {
  const { projectId } = req.params
  let rolesToRemove = req.body.roles ?? req.body
  const user = req.user
  if (!user) return respondWithError(res, 401, "Unauthenticated request")
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
    rolesToRemove = scrubDefaultRoles(rolesToRemove)
    if (!rolesToRemove) {
      return respondWithError(res, 400, `No custom roles provided.`)
    }
    const project = new Project(projectId)
    if (!(await project.checkUserAccess(user._id, ACTIONS.DELETE, SCOPES.ALL, ENTITIES.ROLE))) {
      return respondWithError(res, 403, "You do not have permission to remove custom roles.")
    }
    const group = new Group(project.data.group)
    await group.removeCustomRoles(rolesToRemove)
    res.status(200).json({ message: 'Custom roles removed successfully.' })
  } catch (error) {
    respondWithError(res, error.status ?? 500, error.message ?? 'Error removing custom roles.')
  }
})

export default router
