import express from "express"
import { respondWithError } from "../utilities/shared.js"
import validateURL from "../utilities/validateURL.js"
import Tools from "../classes/Tools/Tools.js"

const router = express.Router({ mergeParams: true })

//Add Iframe Tool to Project
router.route("/:projectId/addIframeTool").post(async (req, res) => {
  const { label, toolName, url, location, state } = req.body
  if (!label || !toolName || !url || !location) {
    return respondWithError(res, 400, "label, toolName, url, and location are required fields.")
  }
  try {
    const projectId = req.params.projectId
    if (!projectId || !validateURL(projectId)) {
      return respondWithError(res, 400, "A valid project ID is required.")
    }
    const tools = new Tools(projectId)
    if (await tools.checkIfToolExists(toolName)) {
      return respondWithError(res, 400, "Tool with the same name already exists")
    }
    const addedTool = await tools.addIframeTool(label, toolName, url, location, state)
    res.status(200).json(addedTool)
  } catch (error) {
    console.error("Error fetching default tools:", error)
    respondWithError(res, error.status || 500, error.message || "An error occurred while adding the tool.")
  }
}).all((_, res) => {
  respondWithError(res, 405, "Improper request method. Use POST instead")
})

// Remove Tool from Project
router.route("/:projectId/removeTool").delete(async (req, res) => {
  const { toolName } = req.body
  if (!toolName) {
    return respondWithError(res, 400, "toolName is a required field.")
  }
  try {
    const projectId = req.params.projectId
    if (!projectId || !validateURL(projectId)) {
      return respondWithError(res, 400, "A valid project ID is required.")
    }
    const tools = new Tools(projectId)
    if (!await tools.checkIfToolExists(toolName)) {
      return respondWithError(res, 404, "Tool not found")
    }
    const removedTool = await tools.removeTool(toolName)
    res.status(200).json(removedTool)
  } catch (error) {
    console.error("Error removing tool:", error)
    respondWithError(res, error.status || 500, error.message || "An error occurred while removing the tool.")
  }
}).all((_, res) => {
  respondWithError(res, 405, "Improper request method. Use DELETE instead")
})

// Toggle Tool State in Project
router.route("/:projectId/toggleTool").patch(async (req, res) => {
  const { toolName } = req.body
  if (!toolName) {
    return respondWithError(res, 400, "toolName is a required field.")
  }
  try {
    const projectId = req.params.projectId
    if (!projectId || !validateURL(projectId)) {
      return respondWithError(res, 400, "A valid project ID is required.")
    }
    const tools = new Tools(projectId)
    if (!await tools.checkIfToolExists(toolName)) {
      return respondWithError(res, 404, "Tool not found")
    }
    const toggledTool = await tools.toggleTool(toolName)
    res.status(200).json(toggledTool)
  } catch (error) {
    console.error("Error toggling tool state:", error)
    respondWithError(res, error.status || 500, error.message || "An error occurred while toggling the tool state.")
  }
}).all((_, res) => {
  respondWithError(res, 405, "Improper request method. Use PATCH instead")
})

export default router
