import express from "express"
import { respondWithError } from "../utilities/shared.js"
import auth0Middleware from "../auth/index.js"
import Project from "../classes/Project/Project.js"
import Group from "../classes/Group/Group.js"

const router = express.Router({ mergeParams: true })

/**
 * Allows an authenticated member to voluntarily leave a project.
 *
 * Validations:
 * - User must be authenticated
 * - User must be a member of the project
 * - User cannot be the only OWNER (must transfer ownership first)
 * - User cannot be the only LEADER (another leader must exist)
 *
 * @route POST /project/:projectId/leave
 * @param {string} projectId - The project the user wants to leave
 * @returns {Object} Success message with projectId
 */
router.route("/:projectId/leave").post(auth0Middleware(), async (req, res) => {
  const { projectId } = req.params
  const user = req.user

  if (!user) return respondWithError(res, 401, "Authentication required")
  if (!projectId) return respondWithError(res, 400, "Project ID is required")

  try {
    const project = await Project.getById(projectId)
    if (!project?.data) {
      return respondWithError(res, 404, "Project not found")
    }

    const group = new Group(project.data.group)
    const members = await group.getMembers()

    // Check if user is a member
    if (!members[user._id]) {
      return respondWithError(res, 400, "You are not a member of this project")
    }

    const userRoles = members[user._id].roles

    // Prevent leaving if user is the only OWNER
    if (userRoles.includes("OWNER")) {
      const owners = group.getByRole("OWNER")
      if (owners.length <= 1) {
        return respondWithError(res, 403,
          "Cannot leave: You are the only owner. Transfer ownership first.")
      }
    }

    // Prevent leaving if user is the only LEADER
    if (userRoles.includes("LEADER")) {
      const leaders = group.getByRole("LEADER")
      if (leaders.length <= 1) {
        return respondWithError(res, 403,
          "Cannot leave: You are the only leader. Assign another leader first.")
      }
    }

    // Remove the member
    await project.removeMember(user._id)

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
