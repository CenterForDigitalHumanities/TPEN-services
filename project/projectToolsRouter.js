import express from "express"
import { respondWithError } from "../utilities/shared.js"
import validateURL from "../utilities/validateURL.js"
import Tools from "../classes/Tools/Tools.js"

const router = express.Router({ mergeParams: true })

//Add Tool to Project
router.route("/:projectId/tool").post(async (req, res) => {
  const { label, toolName, url, location, custom } = req?.body
  let { enabled, tagName } = custom
  if (!label || !toolName || !location) {
    return respondWithError(res, 400, "label, toolName, and location are required fields.")
  }
  try {
    const projectId = req.params.projectId
    if (!projectId || !validateURL(projectId)) {
      return respondWithError(res, 400, "A valid project ID is required.")
    }
    const tools = new Tools(projectId)
    await tools.validateToolArray(req?.body)
    if (await tools.checkIfToolExists(toolName)) {
      return respondWithError(res, 400, "Tool with the same name already exists")
    }
    if (await tools.checkIfToolLabelExists(label)) {
      return respondWithError(res, 400, "Tool with the same label already exists")
    }
    if (await tools.checkIfInDefaultTools(toolName)) {
      return respondWithError(res, 400, "Default tools cannot be altered")
    }
    if (url !== undefined && url !== "" && await tools.checkIfURLisJSScript(url)) {
      const fetchedTagname = await tools.getTagnameFromScript(url)
      if (!fetchedTagname || !await tools.checkToolPattern(fetchedTagname)) {
          throw { status: 400, message: "Could not extract a valid tagname from the provided JavaScript URL." }
      }
      tagName = fetchedTagname
    }
    if (tagName !== undefined && tagName !== "" && !await tools.checkIfTagNameExists(tagName)) {
      tagName = ""
    }
    const addedTool = await tools.addIframeTool(label, toolName, url, location, enabled, tagName)
    res.status(200).json(addedTool)
  } catch (error) {
    console.error("Error adding tool:", error)
    respondWithError(res, error.status || 500, error.message || "An error occurred while adding the tool.")
  }
}).delete(async (req, res) => {
  const { toolName } = req.body
  if (!toolName) {
    return respondWithError(res, 400, "toolName is a required field.")
  }
  if (typeof toolName !== "string") {
    return respondWithError(res, 400, "toolName must be a string.")
  }
  try {
    const projectId = req.params.projectId
    if (!projectId || !validateURL(projectId)) {
      return respondWithError(res, 400, "A valid project ID is required.")
    }
    const tools = new Tools(projectId)
    if (!await tools.checkToolPattern(toolName)) {
      return respondWithError(res, 400, "toolName must be in 'lowercase-with-hyphens' format.")
    }
    if (!await tools.checkIfToolExists(toolName)) {
      return respondWithError(res, 404, "Tool not found")
    }
    if (await tools.checkIfInDefaultTools(toolName)) {
      return respondWithError(res, 400, "Default tools cannot be removed")
    }
    const removedTool = await tools.removeTool(toolName)
    res.status(200).json(removedTool)
  } catch (error) {
    console.error("Error removing tool:", error)
    respondWithError(res, error.status || 500, error.message || "An error occurred while removing the tool.")
  }
}).all((_, res) => {
  respondWithError(res, 405, "Improper request method. Use POST to add a tool or DELETE to remove a tool.")
})

// Toggle Tool State in Project
router.route("/:projectId/toggleTool").put(async (req, res) => {
  const { toolName } = req.body
  if (!toolName) {
    return respondWithError(res, 400, "toolName is a required field.")
  }
  if (typeof toolName !== "string") {
    return respondWithError(res, 400, "toolName must be a string.")
  }
  try {
    const projectId = req.params.projectId
    if (!projectId || !validateURL(projectId)) {
      return respondWithError(res, 400, "A valid project ID is required.")
    }
    const tools = new Tools(projectId)
    if (!await tools.checkToolPattern(toolName)) {
      return respondWithError(res, 400, "toolName must be in 'lowercase-with-hyphens' format.")
    }
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
