import express from "express"
import { respondWithError } from "../utilities/shared.js"
import Project from "../classes/Project/Project.js"
import User from "../classes/User/User.js"

const router = express.Router({ mergeParams: true })

/**
 * A user is declining from the E-mail they received.  It is unauthenticated.
 * Their member entry should be removed from the Group.
 * Their temporary user should be removed from the db.
 *
 * @param projectId - The project which contains the temporary TPEN3 User as a member.
 * @param collaboratorId - The temporary TPEN3 User declining the invitation.
 */
router.route("/:projectId/collaborator/:collaboratorId/decline").get(async (req, res) => {
  const { projectId, collaboratorId  } = req.params
  if (!projectId || !collaboratorId) return respondWithError(res, 400, "Not all data was provided.")
  try {
    const project = await new Project(projectId)
    const projectData = await project.loadProject()
    if (!projectData) return respondWithError(res, 404, "Project does not exist or the project id is invalid.")
    const invitedUser = new User(collaboratorId)
    const userData = await invitedUser.getSelf()
    if (!userData?.profile) return respondWithError(res, 404, "This user has already declined or the user id is invalid.")
    if (!userData?.inviteCode) return respondWithError(res, 400, "This user has already accepted the invitation.")
    await project.removeMember(collaboratorId)
    const name = userData.email ?? userData.profile.displayName ?? collaboratorId
    res.status(200).send(`User '${name}' successfully declined the invitation.`)
  } catch (error) {
    return respondWithError(
      res,
      error.status ?? 500,
      error.message ?? "There was an error declining the invitation."
    )
  }
}).all((_, res) => {
  respondWithError(res, 405, "Improper request method. Use GET instead")
})

export default router
