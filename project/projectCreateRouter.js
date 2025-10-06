import express from "express"
import { respondWithError } from "../utilities/shared.js"
import auth0Middleware from "../auth/index.js"
import ProjectFactory from "../classes/Project/ProjectFactory.js"
import validateURL from "../utilities/validateURL.js"
import Project from "../classes/Project/Project.js"
import screenContentMiddleware from "../utilities/checkIfSuspicious.js"
import { isSuspiciousJSON, isSuspiciousValueString, hasSuspiciousProjectData } from "../utilities/checkIfSuspicious.js"
import Tools from "../classes/Tools/Tools.js"

const router = express.Router({ mergeParams: true })

router.route("/create").post(auth0Middleware(), screenContentMiddleware(), async (req, res) => {
  const user = req.user
  if (!user?.agent) return respondWithError(res, 401, "Unauthenticated user")
  let project = req.body
  try {
    if (hasSuspiciousProjectData(project)) return respondWithError(res, 400, "Suspicious project data will not be processed.")
    project = { ...project, creator: user?.agent }
    const projectObj = new Project()
    const newProject = await projectObj.create(project)
    res.setHeader("Location", newProject?._id)
    res.status(201).json(newProject)
  } catch (error) {
    console.log("Project creation error")
    console.error(error)
    respondWithError(
      res,
      error.status ?? error.code ?? 500,
      error.message ?? "Unknown server error"
    )
  }
}).all((_, res) => {
  respondWithError(res, 405, "Improper request method. Use POST instead")
})

router.route("/import").post(auth0Middleware(), async (req, res) => {
  let { createFrom } = req.query
  let user = req.user
  createFrom = createFrom?.toLowerCase()
  if (!createFrom)
    return res.status(400).json({
      message:
        "Query string 'createFrom' is required, specify manifest source as 'URL' or 'DOC' "
    })
  if (createFrom === "url") {
    const manifestURL = req?.body?.url
    let tools = req?.body?.tools ?? []
    tools = await new Tools().validateAllTools(tools)
    let checkURL = await validateURL(manifestURL)
    if (!checkURL.valid)
      return res.status(checkURL.status).json({
        message: checkURL.message,
        resolvedPayload: checkURL.resolvedPayload
      })
    try {
      if (isSuspiciousJSON(checkURL.resolvedPayload)) return respondWithError(res, 400, "Suspicious data will not be processed.")
      const result = await ProjectFactory.fromManifestURL(
        manifestURL,
        user.agent.split('/').pop(),
        tools
      )
      res.status(201).json(result)
    } catch (error) {
      console.log("project import error")
      console.error(error)
      res.status(error.status ?? 500).json({
        status: error.status ?? 500,
        message: error.message,
        data: error.resolvedPayload
      })
    }
  } else if (createFrom === "tpen28url") {
    const manifestURL = req?.body?.url
    let tools = req?.body?.tools ?? []
    tools = await new Tools().validateAllTools(tools)
    let checkURL = await validateURL(manifestURL)
    if (!checkURL.valid)
      return res.status(checkURL.status).json({
        message: checkURL.message,
        resolvedPayload: checkURL.resolvedPayload
      })
    try {
      if (isSuspiciousJSON(checkURL.resolvedPayload)) return respondWithError(res, 400, "Suspicious data will not be processed.")
      const result = await ProjectFactory.fromManifestURL(
        manifestURL,
        user.agent.split('/').pop(),
        tools,
        true
      )
      res.status(201).json(result)
    } catch (error) {
      console.log("TPEN 2.8 project import error")
      console.error(error)
      res.status(error.status ?? 500).json({
        status: error.status ?? 500,
        message: error.message,
        data: error.resolvedPayload
      })
    }
  } else {
    res.status(400).json({
      message: `Import from ${createFrom} is not available. Create from URL instead`
    })
  }
}).all((req, res) => {
  respondWithError(res, 405, "Improper request method. Use POST instead")
})

router.route("/import-image").post(auth0Middleware(), async (req, res) => {
  const user = req.user
  if (!user?.agent) return respondWithError(res, 401, "Unauthenticated user")
  try {
    const { imageUrl, projectLabel } = req.body
    if (!imageUrl || !projectLabel) {
      return respondWithError(res, 400, "Image URL and project label are required")
    }
    if (isSuspiciousValueString(projectLabel, true)) return respondWithError(res, 400, "Suspicious project label will not be processed.")
    const project = await ProjectFactory.createManifestFromImage(imageUrl, projectLabel, user.agent.split('/').pop())
    res.status(201).json(project)
  } catch (error) {
    console.log("Create project from image error")
    console.error(error)
    respondWithError(
      res,
      error.status ?? error.code ?? 500,
      error.message ?? "Unknown server error"
    )
  }
}
).all((_, res) => {
  respondWithError(res, 405, "Improper request method. Use POST instead")
})

/**
 * Free typed strings may be malicious or rude.  The key 'label' is not malicious but the value req.body.label could be.
 */
router.route("/:projectId/label").patch(auth0Middleware(), screenContentMiddleware(), async (req, res) => {
  const user = req.user
  if (!user?.agent) return respondWithError(res, 401, "Unauthenticated user")
  const projectId = req.params.projectId
  if (!projectId) return respondWithError(res, 400, "Project ID is required")
  const { label } = req.body
  if (typeof label !== "string" || !label?.trim()) return respondWithError(res, 400, "JSON with a 'label' property required in the request body.  It cannot be null or blank and must be a string.")
  try {
    let project = new Project(projectId)
    const loadedProject = await project.loadProject()
    if (!loadedProject) return respondWithError(res, 404, "Project not found")
    project = await project.setLabel(label)
    res.status(200).json(project)
  } catch (error) {
    respondWithError(
      res,
      error.status ?? error.code ?? 500,
      error.message ?? "Unknown server error"
    )
  }
}).all((_, res) => {
  respondWithError(res, 405, "Improper request method. Use PATCH instead")
})

export default router
