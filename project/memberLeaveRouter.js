import express from "express"
import { respondWithError } from "../utilities/shared.js"
import auth0Middleware from "../auth/index.js"
import Project from "../classes/Project/Project.js"
import Group from "../classes/Group/Group.js"

const router = express.Router({ mergeParams: true })

/**
 * A user is leaving the project.
 * Their member entry should be removed from the Group.
 *
 * @param projectId - The project a user it attempting to leave
 */
router.route("/:projectId/leave").post(auth0Middleware(), async (req, res) => {
  const user = req.user
  const name = user.profile.displayName ?? user.email ?? user._id
  const { projectId  } = req.params
  if (!projectId) return respondWithError(res, 400, "Not all data was provided.")
  try {
    const project = await new Project(projectId)
    const projectData = await project.loadProject()
    if (!projectData) return respondWithError(res, 404, "Project does not exist or the project id is invalid.")
    const members = await new Group(projectData.group).getMembers()
    let leaderCount = 0
    let memberIdList = []
    for (const key in members) {
      memberIdList.push(key)
      if (members[key].roles.includes("LEADER")) leaderCount++
    }
    // Guarded members list conditions.
    if (!memberIdList.includes(user._id))
      return respondWithError(res, 400, `User '${name}' already isn't a member of the project.`)
    if (members[user._id].roles.includes("OWNER")) 
      return respondWithError(res, 403, "You are the owner.  You must transfer ownership before you leave.")
    if (members[user._id].roles.includes("LEADER") && leaderCount === 1) 
      return respondWithError(res, 403, "You are the last remaining leader.  You must appoint another leader before you leave.")
    await project.removeMember(user._id)
    res.status(200).send(`User '${name}' successfully left the project.`)
  } catch (error) {
    console.error(error)
    return respondWithError(
      res,
      error.status || error.code || 500,
      error.message ?? "There was an error leaving the project."
    )
  }
}).all((_, res) => {
  respondWithError(res, 405, "Improper request method. Use POST instead")
})

export default router
