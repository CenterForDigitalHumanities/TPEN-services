import express from "express"
import { isValidEmail } from "../utilities/validateEmail.js"
import { respondWithError } from "../utilities/shared.js"
import auth0Middleware from "../auth/index.js"
import Project from "../classes/Project/Project.js"
import { ACTIONS, ENTITIES, SCOPES } from "./groups/permissions_parameters.js"
import Group from "../classes/Group/Group.js"

const router = express.Router({ mergeParams: true })

// Invite member
router.route("/:id/invite-member").post(auth0Middleware(), async (req, res) => {
  const user = req.user
  const { id: projectId } = req.params
  const { email, roles } = req.body
  if (!user) return respondWithError(res, 401, "Unauthenticated request")
  if (!email) return respondWithError(res, 400, "Invitee's email is required")
  if (!isValidEmail(email)) return respondWithError(res, 400, "Invitee email is invalid")
  try {
    const project = new Project(projectId)
    if (await project.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.ALL, ENTITIES.MEMBER)) {
      const response = await project.sendInvite(email, roles)
      res.status(200).json(response)
    } else {
      res.status(403).send("You do not have permission to invite members to this project")
    }
  } catch (error) {
    res.status(error.status || 500).send(error.message.toString())
  }
})

// Remove member
router.route("/:id/remove-member").post(auth0Middleware(), async (req, res) => {
  const user = req.user
  const { id: projectId } = req.params
  const { userId } = req.body
  if (!user) return respondWithError(res, 401, "Unauthenticated request")
  if (!projectId) return respondWithError(res, 400, "Project ID is required")
  if (!userId) return respondWithError(res, 400, "User ID is required")
  try {
    const project = new Project(projectId)
    if (await project.checkUserAccess(user._id, ACTIONS.DELETE, SCOPES.ALL, ENTITIES.MEMBER)) {
      await project.removeMember(userId)
      res.sendStatus(204)
    } else {
      res.status(403).send("You do not have permission to remove members from this project")
    }
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message ?? "Error removing member from project.")
  }
})

// Add, set, remove roles
router.route("/:projectId/collaborator/:collaboratorId/addRoles").post(auth0Middleware(), async (req, res) => {
  const { projectId, collaboratorId } = req.params
  const roles = req.body.roles ?? req.body
  const user = req.user
  if (!user) return respondWithError(res, 401, "Unauthenticated request")
  if (!roles) return respondWithError(res, 400, "Provide role(s) to add")
  try {
    const projectObj = new Project(projectId)
    if (!(await projectObj.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.ALL, ENTITIES.MEMBER))) {
      return respondWithError(res, 403, "You do not have permission to add roles to members.")
    }
    const groupId = projectObj.data.group
    const group = new Group(groupId)
    await group.addMemberRoles(collaboratorId, roles)
    await group.update()
    res.status(200).send(`Roles added to member ${collaboratorId}.`)
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message ?? "Error adding roles to member.")
  }
})

router.route("/:projectId/collaborator/:collaboratorId/setRoles").put(auth0Middleware(), async (req, res) => {
  const { projectId, collaboratorId } = req.params
  const roles = req.body.roles ?? req.body
  const user = req.user
  if (!user) return respondWithError(res, 401, "Unauthenticated request")
  if (!roles) return respondWithError(res, 400, "Provide role(s) to update")
  try {
    const projectObj = new Project(projectId)
    if (!(await projectObj.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.ALL, ENTITIES.MEMBER))) {
      return respondWithError(res, 403, "You do not have permission to update member roles.")
    }
    const group = new Group(projectObj.data.group)
    await group.setMemberRoles(collaboratorId, roles)
    res.status(200).send(`Roles [${roles}] updated for member ${collaboratorId}.`)
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message ?? "Error updating member roles.")
  }
})

router.route("/:projectId/collaborator/:collaboratorId/removeRoles").post(auth0Middleware(), async (req, res) => {
  const { projectId, collaboratorId } = req.params
  const roles = req.body.roles ?? req.body
  const user = req.user
  if (!user) return respondWithError(res, 401, "Unauthenticated request")
  if (!roles) return respondWithError(res, 400, "Provide role(s) to remove")
  if (roles.includes("OWNER")) return respondWithError(res, 400, "The OWNER role cannot be removed.")
  try {
    const projectObj = new Project(projectId)
    if (!(await projectObj.checkUserAccess(user._id, ACTIONS.DELETE, SCOPES.ALL, ENTITIES.MEMBER))) {
      return respondWithError(res, 403, "You do not have permission to remove roles from members.")
    }
    const groupId = projectObj.data.group
    const group = new Group(groupId)
    await group.removeMemberRoles(collaboratorId, roles)
    res.status(204).send(`Roles [${roles}] removed from member ${collaboratorId}.`)
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message ?? "Error removing roles from member.")
  }
})

// Switch project owner
router.route("/:projectId/switch/owner").post(auth0Middleware(), async (req, res) => {
  const { projectId } = req.params
  const { newOwnerId } = req.body
  const user = req.user
  if (!user) return respondWithError(res, 401, "Unauthenticated request")
  if (!newOwnerId) return respondWithError(res, 400, "Provide the ID of the new owner.")
  if (user._id === newOwnerId) return respondWithError(res, 400, "Cannot transfer ownership to the current owner.")
  try {
    const projectObj = new Project(projectId)
    if (!(await projectObj.checkUserAccess(user._id, ACTIONS.ALL, SCOPES.ALL, ENTITIES.ALL))) {
      return respondWithError(res, 403, "You do not have permission to transfer ownership.")
    }
    const group = new Group(projectObj.data.group)
    if (user._id === newOwnerId) {
      return respondWithError(res, 400, "Cannot transfer ownership to the current owner.")
    }
    const currentRoles = await group.getMemberRoles(user._id)
    Object.keys(currentRoles).length === 1 && await group.addMemberRoles(user._id, ["CONTRIBUTOR"])
    await group.addMemberRoles(newOwnerId, ["OWNER"], true)
    await group.removeMemberRoles(user._id, ["OWNER"], true)
    await group.update()
    res.status(200).json({ message: `Ownership successfully transferred to member ${newOwnerId}.` })
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message ?? "Error transferring ownership.")
  }
})

export default router
