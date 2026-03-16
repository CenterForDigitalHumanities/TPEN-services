import express from "express"
import { validateID, respondWithError } from "../utilities/shared.js"
import auth0Middleware from "../auth/index.js"
import ProjectFactory from "../classes/Project/ProjectFactory.js"
import Project from "../classes/Project/Project.js"
import { ACTIONS, ENTITIES, SCOPES } from "./groups/permissions_parameters.js"

const router = express.Router({ mergeParams: true })

/**
 * Helper function to determine which interfaces namespaces to include
 * @param {Request} req - Express request object
 * @returns {Array|string} - Array of namespaces to include, or "*" for all
 */
function getNamespacesToInclude(req) {
  const origin = req.headers.origin || req.headers.referer || ""
  const host = req.headers.host || req.hostname || ""
  
  // Check for localhost or local network addresses (wildcard)
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?/.test(origin) ||
                     /(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?/.test(host)
  
  // Check for includes query parameter
  const includesParam = req.query.includes
  
  // If includes=* or localhost, return all namespaces
  if (includesParam === "*" || isLocalhost) {
    return "*"
  }
  
  // If includes parameter is provided, parse it
  if (includesParam) {
    // Handle both single value and array
    const includesArray = Array.isArray(includesParam) ? includesParam : [includesParam]
    return includesArray
  }
  
  // Otherwise, return just the origin namespace if we can parse it
  if (origin) {
    try {
      const url = new URL(origin)
      return [url.hostname]
    } catch (e) {
      // Fall through to return wildcard
    }
  }
  
  // If we can't determine origin, default to wildcard for backward compatibility
  // This ensures metadata is visible when testing locally or when origin headers are missing
  return "*"
}

/**
 * Filter interfaces based on allowed namespaces
 * @param {Object} project - Project object with interfaces
 * @param {Array|string} namespaces - Namespaces to include ("*" for all)
 * @returns {Object} - Project with filtered interfaces
 */
function filterProjectInterfaces(project, namespaces) {
  if (!project || !project.interfaces) {
    return project
  }

  // If wildcard, return all interfaces
  if (namespaces === "*") {
    return project
  }

  // If no namespaces specified, remove all interfaces
  if (!namespaces || namespaces.length === 0) {
    const { interfaces, ...projectWithoutInterfaces } = project
    return projectWithoutInterfaces
  }
  
  // Filter to only include specified namespaces
  const filteredInterfaces = {}
  for (const ns of namespaces) {
    if (project.interfaces[ns] !== undefined) {
      filteredInterfaces[ns] = project.interfaces[ns]
    }
  }
  
  // If no matching namespaces found, remove the field
  if (Object.keys(filteredInterfaces).length === 0) {
    const { interfaces, ...projectWithoutInterfaces } = project
    return projectWithoutInterfaces
  }
  
  return {
    ...project,
    interfaces: filteredInterfaces
  }
}

/**
 * Check whether a user has the required access on a project loaded via ProjectFactory.loadAsUser().
 * This avoids a second database round-trip when the project data (with collaborators/roles) is
 * already available from the loadAsUser aggregation result.
 *
 * @param {Object} projectData - The project object returned by ProjectFactory.loadAsUser()
 * @param {string} userId - The user ID to check
 * @param {string} action - Required action (e.g. ACTIONS.READ)
 * @param {string} scope - Required scope (e.g. SCOPES.ALL)
 * @param {string} entity - Required entity (e.g. ENTITIES.PROJECT)
 * @returns {boolean}
 */
function userHasAccess(projectData, userId, action, scope, entity) {
  const userRoleNames = projectData?.collaborators?.[userId]?.roles
  if (!userRoleNames || !Array.isArray(userRoleNames)) return false
  const rolePermissions = projectData.roles ?? {}
  return userRoleNames.some(role => {
    const perms = rolePermissions[role]
    if (!perms || !Array.isArray(perms)) return false
    return perms.some(perm => {
      const [permAction, permScope, permEntity] = perm.split("_")
      return (permAction === action || permAction === "*") &&
             (permScope === scope || permScope === "*") &&
             (permEntity === entity || permEntity === "*")
    })
  })
}


router.route("/:id/manifest").get(auth0Middleware(), async (req, res) => {
  const { id } = req.params
  const user = req.user
  if (!user) return respondWithError(res, 401, "Not authenticated. Please provide a valid, unexpired Bearer token")
  if (!id) return respondWithError(res, 400, "No TPEN3 ID provided")
  if (!validateID(id)) return respondWithError(res, 400, "The TPEN3 project ID provided is invalid")
  try {
    const project = new Project(id)
    if (!await project.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.ALL, ENTITIES.PROJECT)) {
      return respondWithError(res, 403, "You do not have permission to export this project")
    }
    if (!project.data) {
      return respondWithError(res, 404, `No TPEN3 project with ID '${id}' found`)
    }
    const manifest = await ProjectFactory.exportManifest(id, project.data)
    await ProjectFactory.uploadFileToGitHub(manifest, `${id}`)
    res.status(200).json(manifest)
  } catch (error) {
    return respondWithError(
      res,
      error.status || error.code || 500,
      error.message ?? "An error occurred while fetching the project data."
    )
  }
}).all((_, res) => {
  return respondWithError(res, 405, "Improper request method. Use GET instead")
})

router.route("/:id/deploymentStatus").get(auth0Middleware(), async (req, res) => {
  const user = req.user
  const { id } = req.params
  if (!user) return respondWithError(res, 401, "Not authenticated. Please provide a valid, unexpired Bearer token")
  if (!id) return respondWithError(res, 400, "No TPEN3 ID provided")
  if (!validateID(id)) return respondWithError(res, 400, "The TPEN3 project ID provided is invalid")
  try {
    const project = new Project(id)
    if (!(await project.checkUserAccess(user._id, ACTIONS.READ, SCOPES.ALL, ENTITIES.PROJECT))) {
      return respondWithError(res, 403, "You do not have permission to view this project's deployment status")
    }
    const { status } = await ProjectFactory.checkManifestUploadAndDeployment(id)
    if (!status) {
      return respondWithError(res, 404, `No deployment status found for project with ID '${id}'`)
    }
    if (status === -1) {
      return respondWithError(res, 503, "Invalid deployment status.")
    }
    res.status(200).json(status)
  } catch (error) {
    return respondWithError(
      res,
      error.status || error.code || 500,
      error.message ?? "An error occurred while checking the deployment status."
    )
  }
}).all((_, res) => {
  return respondWithError(res, 405, "Improper request method. Use GET instead")
})

router.route("/:id").get(auth0Middleware(), async (req, res) => {
  const user = req.user
  if (!user) return respondWithError(res, 401, "Not authenticated. Please provide a valid, unexpired Bearer token")
  let id = req.params.id
  if (!id) return respondWithError(res, 400, "No TPEN3 ID provided")
  if (!validateID(id)) return respondWithError(res, 400, "The TPEN3 project ID provided is invalid")
  try {
    // loadAsUser() returns an Error object (not throws) on DB failure; check both null and error cases
    const projectData = await ProjectFactory.loadAsUser(id, user._id)
    if (!projectData || projectData instanceof Error) {
      return respondWithError(res, 404, `No TPEN3 project with ID '${id}' found`)
    }
    if (!userHasAccess(projectData, user._id, ACTIONS.READ, SCOPES.ALL, ENTITIES.PROJECT)) {
      return respondWithError(res, 403, "You do not have permission to view this project")
    }

    // Filter interfaces based on origin and query parameters
    const namespacesToInclude = getNamespacesToInclude(req)
    const filteredProject = filterProjectInterfaces(projectData, namespacesToInclude)

    res.status(200).json(filteredProject)
  } catch (error) {
    return respondWithError(
      res,
      error.status || error.code || 500,
      error.message ?? "An error occurred while fetching the project data."
    )
  }
}).all((_, res) => {
  return respondWithError(res, 405, "Improper request method. Use GET instead")
})

export default router
