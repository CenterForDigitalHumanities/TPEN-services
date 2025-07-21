import express from "express"
import { validateID, respondWithError } from "../utilities/shared.js"
import auth0Middleware from "../auth/index.js"
import ProjectFactory from "../classes/Project/ProjectFactory.js"
import Project from "../classes/Project/Project.js"
import { ACTIONS, ENTITIES, SCOPES } from "./groups/permissions_parameters.js"

const router = express.Router({ mergeParams: true })

router.route("/:id/manifest").get(auth0Middleware(), async (req, res) => {
  const { id } = req.params
  const user = req.user
  if (!id) return respondWithError(res, 400, "No TPEN3 ID provided")
  if (!validateID(id)) return respondWithError(res, 400, "The TPEN3 project ID provided is invalid")
  try {
    const project = await ProjectFactory.loadAsUser(id, null)
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
  respondWithError(res, 405, "Improper request method. Use GET instead")
})

router.route("/:id/deploymentStatus").get(auth0Middleware(), async (req, res) => {
  const { id } = req.params
  if (!id) return respondWithError(res, 400, "No TPEN3 ID provided")
  if (!validateID(id)) return respondWithError(res, 400, "The TPEN3 project ID provided is invalid")
  try {
    const status = await ProjectFactory.checkManifestUploadAndDeployment(id)
    res.status(200).json(status)
  } catch (error) {
    return respondWithError(
      res,
      error.status || error.code || 500,
      error.message ?? "An error occurred while checking the deployment status."
    )
  }
}).all((_, res) => {
  respondWithError(res, 405, "Improper request method. Use GET instead")
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
    res.status(200).json(project)
  } catch (error) {
    return respondWithError(
      res,
      error.status || error.code || 500,
      error.message ?? "An error occurred while fetching the project data."
    )
  }
}).all((_, res) => {
  respondWithError(res, 405, "Improper request method. Use GET instead")
})

export default router
