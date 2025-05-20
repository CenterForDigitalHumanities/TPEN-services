import express from "express"
import cors from "cors"
import common_cors from "../utilities/common_cors.json" with {type: "json"}
import layerRouter from "../layer/index.js"
import projectCreateRouter from "./projectCreateRouter.js"
import import28Router from "./import28Router.js"
import projectReadRouter from "./projectReadRouter.js"
import memberRouter from "./memberRouter.js"
import customRolesRouter from "./customRolesRouter.js"
import hotkeysRouter from "./hotkeysRouter.js"
import metadataRouter from "./metadataRouter.js"

const router = express.Router({ mergeParams: true })
router.use(cors(common_cors))

// Use split routers
router.use(projectCreateRouter)
router.use(import28Router)
router.use(projectReadRouter)
router.use(memberRouter)
router.use(customRolesRouter)
router.use(hotkeysRouter)
router.use(metadataRouter)

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
}).all((_, res) => {
  respondWithError(res, 405, "Improper request method. Use PUT instead")
})


// Nested route for layers within a project
router.use('/:projectId/layer', layerRouter)

export default router
