import express from "express"
import { respondWithError } from "../utilities/shared.js"
import auth0Middleware from "../auth/index.js"
import Project from "../classes/Project/Project.js"
import Hotkeys from "../classes/HotKeys/Hotkeys.js"
import { ACTIONS, ENTITIES, SCOPES } from "./groups/permissions_parameters.js"

const router = express.Router({ mergeParams: true })

// Create Hotkey
router.route("/:projectId/hotkeys").post(auth0Middleware(), async (req, res) => {
  const user = req.user
  const { projectId } = req.params
  const { symbols } = req.body
  if (!user) return respondWithError(res, 401, "Unauthenticated request")
  if (!symbols || symbols.length === 0) return respondWithError(res, 400, "At least one symbol is required")
  try {
    const project = new Project(projectId)
    if (await project.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.OPTIONS, ENTITIES.PROJECT)) {
      const hotkeys = new Hotkeys(projectId, symbols)
      const hotkey = await hotkeys.create()
      res.status(201).json(hotkey)
      return
    }
    return respondWithError(res, 403, "You do not have permission to create hotkeys for this project")
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message.toString())
  }
})

// Update Hotkeys
router.route("/:projectId/hotkeys").put(auth0Middleware(), async (req, res) => {
  const user = req.user
  const { projectId } = req.params
  const { symbols } = req.body
  if (!user) return respondWithError(res, 401, "Unauthenticated request")
  if (!symbols || symbols.length === 0) return respondWithError(res, 400, "At least one symbol is required")
  if (!Array.isArray(symbols) || symbols.some(symbol => typeof symbol !== 'string')) {
    return respondWithError(res, 400, "All symbols must be strings")
  }
  try {
    const project = new Project(projectId)
    if (await project.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.OPTIONS, ENTITIES.PROJECT)) {
      const hotkeys = new Hotkeys(projectId, symbols)
      const hotkey = await hotkeys.setSymbols()
      res.status(200).json(hotkey)
      return
    }
    return respondWithError(res, 403, "You do not have permission to update hotkeys for this project")
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message.toString())
  }
})

// Delete Hotkeys
router.route("/:projectId/hotkeys").delete(auth0Middleware(), async (req, res) => {
  const user = req.user
  const { projectId } = req.params
  if (!user) return respondWithError(res, 401, "Unauthenticated request")
  try {
    const project = new Project(projectId)
    if (await project.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.OPTIONS, ENTITIES.PROJECT)) {
      const hotkeys = new Hotkeys(projectId)
      const isDeleted = await hotkeys.delete()
      res.status(200).json(isDeleted)
      return
    }
    return respondWithError(res, 403, "You do not have permission to delete hotkeys for this project")
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message.toString())
  }
})

// Get Hotkeys for a project
router.route("/:projectId/hotkeys").get(auth0Middleware(), async (req, res) => {
  const user = req.user
  const { projectId } = req.params
  if (!user) return respondWithError(res, 401, "Unauthenticated request")
  try {
    const project = new Project(projectId)
    if (await project.checkUserAccess(user._id, ACTIONS.READ, SCOPES.OPTIONS, ENTITIES.PROJECT)) {
      const H = await Hotkeys.getByProjectId(projectId)
      res.status(200).json(H.symbols)
      return
    }
    return respondWithError(res, 403, "You do not have permission to view hotkeys for this project")
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message.toString())
  }
})

router.route("/:projectId/hotkeys").all((_, res) => {
  respondWithError(res, 405, "Improper request method. Use GET, PUT, or DELETE instead")
})

export default router
