import express from "express"
import { respondWithError } from "../utilities/shared.js"
import auth0Middleware from "../auth/index.js"
import Project from "../classes/Project/Project.js"

const router = express.Router({ mergeParams: true })

/**
 * Allows an authenticated member to voluntarily leave a project.
 *
 * @route POST /project/:id/leave
 * @param {string} id - The project the user wants to leave
 * @returns {Object} Success message with project id
 */
router.route("/:id/leave").post(auth0Middleware(), async (req, res) => {
  const { id: projectId } = req.params
  const user = req.user

  if (!user) return respondWithError(res, 401, "Authentication required")
  if (!projectId) return respondWithError(res, 400, "Project ID is required")

  try {
    const project = await Project.getById(projectId)
    if (!project?.data) {
      return respondWithError(res, 404, "Project not found")
    }

    await project.removeMember(user._id, true)

    res.status(200).json({
      message: "Successfully left the project",
      projectId: projectId
    })

  } catch (error) {
    return respondWithError(res, error.status ?? 500,
      error.message ?? "Error leaving project")
  }
})

export default router
