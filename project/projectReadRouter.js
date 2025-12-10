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


router.route("/:id/manifest").get(auth0Middleware(), async (req, res) => {
  const { id } = req.params
  const user = req.user
  if (!id) return respondWithError(res, 400, "No TPEN3 ID provided")
  if (!validateID(id)) return respondWithError(res, 400, "The TPEN3 project ID provided is invalid")
  try {
    const project = await ProjectFactory.loadAsUser(id, null)
    if (!project) {
      return respondWithError(res, 404, `No TPEN3 project with ID '${id}' found`)
    }
    const collaboratorIdList = Object.keys(project.collaborators)
    if (!collaboratorIdList.includes(user._id)) {
      return respondWithError(res, 403, "You do not have permission to export this project")
    }
    if (!await new Project(id).checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.ALL, ENTITIES.PROJECT)) {
      return respondWithError(res, 403, "You do not have permission to export this project")
    }
    const manifest = await ProjectFactory.exportManifest(id)
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
  const { id } = req.params
  if (!id) return respondWithError(res, 400, "No TPEN3 ID provided")
  if (!validateID(id)) return respondWithError(res, 400, "The TPEN3 project ID provided is invalid")
  try {
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
  let id = req.params.id
  if (!id) return respondWithError(res, 400, "No TPEN3 ID provided")
  if (!validateID(id)) return respondWithError(res, 400, "The TPEN3 project ID provided is invalid")
  try {
    const project = await ProjectFactory.loadAsUser(id, user._id)
    if (!project) {
      return respondWithError(res, 404, `No TPEN3 project with ID '${id}' found`)
    }
    
    // Filter interfaces based on origin and query parameters
    const namespacesToInclude = getNamespacesToInclude(req)
    const filteredProject = filterProjectInterfaces(project, namespacesToInclude)

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
