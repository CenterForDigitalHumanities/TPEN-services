import express from "express"
import { respondWithError } from "../utilities/shared.js"
import auth0Middleware from "../auth/index.js"
import ProjectFactory from "../classes/Project/ProjectFactory.js"
import validateURL from "../utilities/validateURL.js"
import Project from "../classes/Project/Project.js"

const router = express.Router({ mergeParams: true })

router.route("/create").post(auth0Middleware(), async (req, res) => {
  const user = req.user
  if (!user?.agent) return respondWithError(res, 401, "Unauthenticated user")
  const projectObj = new Project()
  let project = req.body
  project = { ...project, creator: user?.agent }
  try {
    const newProject = await projectObj.create(project)
    res.setHeader("Location", newProject?._id)
    res.status(201).json(newProject)
  } catch (error) {
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
    let checkURL = await validateURL(manifestURL)
    if (!checkURL.valid)
      return res.status(checkURL.status).json({
        message: checkURL.message,
        resolvedPayload: checkURL.resolvedPayload
      })
    try {
      const result = await ProjectFactory.fromManifestURL(
        manifestURL,
        user._id
      )
      res.status(201).json(result)
    } catch (error) {
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

export default router
