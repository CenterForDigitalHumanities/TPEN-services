import express from "express"
import { respondWithError } from "../utilities/shared.js"
import auth0Middleware from "../auth/index.js"
import screenContentMiddleware from "../utilities/checkIfSuspicious.js"
import Project from "../classes/Project/Project.js"
import { ACTIONS, SCOPES, ENTITIES } from "./groups/permissions_parameters.js"

const router = express.Router({ mergeParams: true })

router.route("/:projectId/metadata").put(auth0Middleware(), screenContentMiddleware(), async (req, res) => {
  const { projectId } = req.params
  const metadata = req.body
  const user = req.user
  if (!user) return respondWithError(res, 401, "Unauthenticated request")
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

export default router
