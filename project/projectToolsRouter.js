import express from "express"
import { respondWithError } from "../utilities/shared.js"
import Project from "../classes/Project/Project.js"
import validateURL from "../utilities/validateURL.js"

const router = express.Router({ mergeParams: true })

// Adding tools to the Project
router.route("/:projectId/tools").post(async (req, res) => {
  const { projectId } = req.params
  const tools = req.body

  if (!projectId) {
    return respondWithError(res, 400, "Project ID is required")
  }

  if (!Array.isArray(tools)) {
    tools = [tools]
  }

  if (tools.every(tool => tool.name === "" || tool.value === "" || tool.url === "" || tool.state === undefined)) {
    return respondWithError(res, 400, "All tools must have a name, value, URL, and state")  
  }

  if (!tools.every(tool => typeof tool.name === "string" && typeof tool.value === "string" && typeof tool.url === "string" && typeof tool.state === "boolean")) {
    return respondWithError(res, 400, "All tools must have a valid name, value, URL, and state")
  }

  if (!tools.every(tool => validateURL(tool.url))) {
    return respondWithError(res, 400, "All tools must have a valid URL")
  }

  try {
    const project = new Project(projectId)
    await project.addTools(tools)
    res.status(201).json("Tools added successfully")
    return
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message.toString())
  }
}).put(async (req, res) => {
  const { projectId } = req.params
  const tools = req.body

  if (!projectId) {
    return respondWithError(res, 400, "Project ID is required")
  }

  if (!Array.isArray(tools) || tools.length === 0) {
    return respondWithError(res, 400, "At least one tool is required")
  }

  if (tools.every(tool => tool.value === "" || tool.state === undefined)) {
    return respondWithError(res, 400, "All tools must have a value and state")  
  }

  if (!tools.every(tool => typeof tool.value === "string" && typeof tool.state === "boolean")) {
    return respondWithError(res, 400, "All tools must have a valid value and state")
  }

  try {
    const project = new Project(projectId)
    await project.updateTools(tools)
    res.status(200).json("Tools updated successfully")
    return
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message.toString())
  }
}).delete(async (req, res) => {
  const { projectId } = req.params
  const { tool } = req.body

  if (!projectId) {
    return respondWithError(res, 400, "Project ID is required")
  }

  if (!tool) {
    return respondWithError(res, 400, "Tool information is required")
  }

  try {
    const project = new Project(projectId)
    await project.removeTool(tool)
    res.status(200).json("Tools removed successfully")
  } catch (error) {
    respondWithError(res, error.status ?? 500, error.message.toString())
  }
}).all((_, res) => {
  respondWithError(res, 405, "Improper request method. Use PUT instead")
})

export default router