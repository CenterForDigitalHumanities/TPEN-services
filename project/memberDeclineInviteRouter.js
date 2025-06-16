import express from "express"
import { validateID, respondWithError } from "../utilities/shared.js"
import Project from "../classes/Project/Project.js"
import User from "../classes/User/User.js"

const router = express.Router({ mergeParams: true })

/**
 * A user is declining from the E-mail they recieved.  It is unauthenticated.
 * Their member entry should be removed from the Group.
 * Their temporary user should be removed from the db.
 *
 * @param projectId - The project which contains the temporary TPEN3 User as a member.
 * @param collaboratorId - The temporary TPEN3 User declining the invitation.
 */
router.route("/:projectId/collaborator/:collaboratorId/decline").get(async (req, res) => {
  console.log("DECLINED")
  const { projectId, collaboratorId  } = req.params
  if (!projectId || !collaboratorId) return respondWithError(res, 400, "Not all data was provided.")
  try {
    const invitedUser = new User(collaboratorId)
    const userData = await invitedUser.getSelf()
    if(!userData?.profile) return respondWithError(res, 404, "Temporary user does not exist")
    if(!userData?.inviteCode) return respondWithError(res, 400, "Temporary user provided is not a temporary user.  Use the project management page instead.")
    const project = await new Project(projectId).loadProject()
    if(!project) return respondWithError(res, 404, "Project does not exist.")
    await project.removeMember(collaboratorId)
    res.status(200).send(`Temporary user '${collaboratorId}' successfully declined the invite.`)
  } catch (error) {
    return respondWithError(
      res,
      error.status || error.code || 500,
      error.message ?? "An error occurred."
    )
  }
}).all((_, res) => {
  respondWithError(res, 405, "Improper request method. Use GET instead")
})

export default router
