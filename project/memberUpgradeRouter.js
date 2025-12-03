import express from "express"
import { respondWithError } from "../utilities/shared.js"
import Project from "../classes/Project/Project.js"
import Group from "../classes/Group/Group.js"
import User from "../classes/User/User.js"

const router = express.Router({ mergeParams: true })

/**
 * Occurs when someone follows the magic link from the invite in their E-mail where
 * the inviteCode does not match the Agent _id from their token on an authenticated route.
 * Ex. A user follows their invite link and logs in with their existing GoG user in the Auth0 tenant.  
 *
 * Remove the 'temporary' user entry in the Group members.
 * By replacing it with the Agent _id from the token.
 * Remove the 'temporary' user from the db.
 * Downstream the existing Agent _id data will be saved as the 'upgraded' user in the TPEN3 db.
 *
 * @param projectId - The project which contains the temporary TPEN3 User as a member.
 * @param collaboratorId - The temporary TPEN3 User wanting a new Agent that matches their inviteCode.
 * @param agentId - The existing Agent _id to use for 'upgrading' the TPEN3 User instead of their collaboratorId.
 */
router.route("/:projectId/collaborator/:collaboratorId/agent/:agentId").get(async (req, res) => {
  const { projectId, collaboratorId, agentId  } = req.params
  if (!projectId || !collaboratorId || !agentId) return respondWithError(res, 400, "Not all data was provided.")
  try {
    const tempUser = new User(collaboratorId)
    const tempData = await tempUser.getSelf()
    if(!tempData?.profile) return respondWithError(res, 404, "Temporary user does not exist")
    if(!tempData?.inviteCode) return respondWithError(res, 400, "Temporary user provided is not a temporary user.")
    const project = new Project(projectId)
    const projectData = await project.loadProject()
    if(!projectData) return respondWithError(res, 404, "Project does not exist.")
    const group = new Group(projectData.group)
    let tempRoles = await group.getMemberRoles(tempData._id)
    if(!tempRoles) tempRoles = {"VIEWER":[]}
    await project.addMember(agentId, Object.keys(tempRoles))
    try {
      // This will also delete the temporary User from the users collection.
      await project.removeMember(tempData._id)
    }
    catch (err) {
      // keep going.
    }
    res.status(200).send(`Temporary user '${collaboratorId}' upgraded to user '${agentId}'.`)
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
