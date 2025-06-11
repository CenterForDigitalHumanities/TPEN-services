import express from "express"
import { validateID, respondWithError } from "../utilities/shared.js"
import Project from "../classes/Project/Project.js"
//import ProjectFactory from "../classes/Project/ProjectFactory.js"
import Group from "../classes/Group/Group.js"
import User from "../classes/User/User.js"

const router = express.Router({ mergeParams: true })

router.route("/tempUserFix").get(async (req, res) => {
  console.log(req.query)
  const { inviteCode, userID, projectID } = req.query
  if (!inviteCode || !userID || !projectID) return respondWithError(res, 400, "Not all data was provided.")
  try {
    const temp = new User(inviteCode)
    const tempData = await temp.getSelf()
    //console.log("temp user")
    //console.log(tempData)
    if(!tempData?.profile) return respondWithError(res, 404, "Temp user does not exist")
    if(!tempData?.inviteCode) return respondWithError(res, 403, "Temp user was not temp")
    const project = await new Project(projectID).loadProject()
    //console.log("project")
    //console.log(project)
    if(!project) return respondWithError(res, 404, "Project does not exist")
    const group = new Group(project.group)
    //console.log("group")
    //console.log(group)
    const tempRoles = await group.getMemberRoles(tempData._id)
    group.removeMember(tempData._id)
    group.addMember(userID, Object.keys(tempRoles))
    await group.update()
    //console.log("group was updated.  Now delete temp user")
    temp.delete()
    res.status(200).json({"msg":"temp user fixed"})
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
