import express from "express"
import {validateID, respondWithError} from "../utilities/shared.mjs"
import * as logic from "./projects.mjs"
import DatabaseDriver from "../database/driver.mjs"
import cors from "cors"
import common_cors from "../utilities/common_cors.json" assert {type: "json"}
import auth0Middleware from "../auth/index.mjs"
import ProjectFactory from "../classes/Project/ProjectFactory.mjs"
import validateURL from "../utilities/validateURL.mjs"
import Project from "../classes/Project/Project.mjs"
import {User} from "../classes/User/User.mjs"

const database = new DatabaseDriver("mongo")
let router = express.Router()

router.use(cors(common_cors))


router
  .route("/create")
  .post(auth0Middleware(), async (req, res) => {
    const user = req.user

    if (!user?.agent) return respondWithError(res, 401, "Unauthenticated user")

    const projectObj = new Project(user?._id)

    let project = req.body
    project = {...project, creator: user?.agent}

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
  })
  .all((req, res) => {
    respondWithError(res, 405, "Improper request method. Use POST instead")
  })

router
  .route("/import")
  .post(auth0Middleware(), async (req, res) => {
    let {createFrom} = req.query
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
          user?.agent
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
  })
  .all((req, res) => {
    respondWithError(res, 405, "Improper request method. Use POST instead")
  })

router
  .route("/:id")
  .get(auth0Middleware(), async (req, res) => {
    const user = req.user
     let id = req.params.id
    if (!id) {
      return respondWithError(res, 400, "No TPEN3 ID provided")
    } else if (!validateID(id)) {
      return respondWithError(
        res,
        400,
        "The TPEN3 project ID provided is invalid"
      )
    }
 
    (async () => {
      try {
        const projectObj = await new Project(id)
        const project = projectObj.projectData
        const accessCheck = projectObj.checkUserAccess(user.agent);
        if (!project) {
          return respondWithError(
            res,
            404,
            `No TPEN3 project with ID '${id}' found`
          )
        } else if (!accessCheck.hasAccess) {
          return respondWithError(
            res,
            401,
           accessCheck.message
          )
        }
        return res.status(200).json(project)
      } catch (error) {
        return respondWithError(
                res,
                error.status || error.code || 500,
                error.message ?? "An error occurred while fetching the user data."
              )
      }
    })()
 
  })
  .all((req, res) => {
    respondWithError(res, 405, "Improper request method. Use GET instead")
  })

router.all((req, res) => {
  respondWithError(res, 405, "Improper request method. Use POST instead")
})

export default router
