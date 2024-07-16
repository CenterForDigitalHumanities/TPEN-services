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

export function respondWithProject(req, res, project) {
  const id = project["@id"] ?? project.id ?? null

  let textType = req.query.text
  let image = req.query.image
  let lookup = req.query.lookup
  let view = req.query.view

  let passedQueries = [textType, image, lookup, view].filter(
    (elem) => elem !== undefined
  )
  let responseType = null
  if (passedQueries.length > 1) {
    respondWithError(
      res,
      400,
      "Improper request. Only one response type may be queried."
    )
    return
  } else if (passedQueries.length === 1) {
    responseType = passedQueries[0]
  }

  let embed = req.query.embed

  let retVal
  switch (responseType) {
    case textType:
      switch (textType) {
        case "blob":
          res.set("Content-Type", "text/plain; charset=utf-8")
          retVal = "mock text"
          break
        case "layers":
          res.set("Content-Type", "application/json; charset=utf-8")
          retVal = [
            {
              name: "Layer.name",
              id: "#AnnotationCollectionId",
              textContent: "concatenated blob"
            }
          ]
          break
        case "pages":
          res.set("Content-Type", "application/json; charset=utf-8")
          retVal = [
            {
              name: "Page.name",
              id: "#AnnotationPageId",
              textContent: "concatenated blob"
            }
          ]
          break
        case "lines":
          res.set("Content-Type", "application/json; charset=utf-8")
          retVal = [
            {
              name: "Page.name",
              id: "#AnnotationPageId",
              textContent: [
                {id: "#AnnotationId", textualBody: "single annotation content"}
              ]
            }
          ]
          break
        default:
          respondWithError(
            res,
            400,
            'Improper request.  Parameter "text" must be "blob," "layers," "pages," or "lines."'
          )
          break
      }
      break

    case image:
      switch (image) {
        case "thumb":
          res.set("Content-Type", "text/uri-list; charset=utf-8")
          retVal = "https://example.com"
          break
        default:
          respondWithError(
            res,
            400,
            'Improper request.  Parameter "image" must be "thumbnail."'
          )
          break
      }
      break

    case lookup:
      switch (lookup) {
        case "manifest":
          retVal = {
            "@context": "http://iiif.io/api/presentation/2/context.json",
            "@id": "https://t-pen.org/TPEN/manifest/7085/manifest.json",
            "@type": "sc:Manifest",
            label: "Ct Interlinear Glosses Mt 5"
          }
          break
        default:
          respondWithError(
            res,
            400,
            'Improper request.  Parameter "lookup" must be "manifest."'
          )
          break
      }
      break

    case view:
      switch (view) {
        case "xml":
          res.set("Content-Type", "text/xml; charset=utf-8")
          retVal = "<xml><id>7085</id></xml>"
          break
        case "html":
          res.set("Content-Type", "text/html; charset=utf-8")
          retVal =
            '<html><body> <pre tpenid="7085"> {"id": "7085", ...}</pre>  </body></html>'
          break
        case "json":
          break
        default:
          respondWithError(
            res,
            400,
            'Improper request.  Parameter "view" must be "json," "xml," or "html."'
          )
          break
      }
      break

    default:
      res.set("Content-Type", "application/json; charset=utf-8")
      res.location(id)
      res.status(200)
      res.json(project)
      return
  }

  res.location(id).status(200).send(retVal)
}

/**
 * Check for valid project keys and create defaults, then send to database
 * @param {Object} req The request object
 * @param {Object} res The response object
 */
async function createNewProject(req, res) {
  let project = req.body
  /* 
  TODO:
    - Add creator based on authenticated user
    - Add group
    - Add slug (and figure out a good way to format it)
    - Check for manifest, create one in the database if it doesn't exist
  */

  // TEMPORARY stubbing out required keys we need to generate
  project.creator = "user"
  project.group = "group"
  project.slug = "slug"

  // Required keys
  if (project.created) {
    if (Number.isNaN(parseInt(project.created))) {
      respondWithError(
        res,
        400,
        'Project key "created" must be a date in UNIX time'
      )
      return
    }
  } else {
    respondWithError(res, 400, 'Project must have key "created"')
    return
  }
  if (project.license) {
    if (typeof project.license !== "string") {
      respondWithError(res, 400, 'Project key "license" must be a string')
      return
    }
  } else {
    project.license = "CC-BY"
  }
  if (project.title) {
    if (typeof project.title !== "string") {
      respondWithError(res, 400, 'Project key "title" must be a string')
      return
    }
  } else {
    project.title = "Project" + project.creator + project.created.toString() // Create a default title
  }

  // Optional keys
  if (project.tools) {
    if (!Array.isArray(project.tools)) {
      respondWithError(res, 400, 'Project key "tools" must be an array')
      return
    }
  }
  if (project.tags) {
    if (!Array.isArray(project.tags)) {
      respondWithError(res, 400, 'Project key "tags" must be an array')
      return
    }
    if (!project.tags.every((tag) => typeof tag === "string")) {
      respondWithError(
        res,
        400,
        'Project key "tags" must be an array of strings'
      )
      return
    }
  }
  if (project.manifest) {
    if (typeof project.manifest !== "string") {
      respondWithError(res, 400, 'Project key "manifest" must be a string')
      return
    }
    if (!url.canParse(project.manifest)) {
      respondWithError(res, 400, 'Project key "manifest" must be a valid URL')
      return
    }
  }
  if (project["@type"]) {
    if (typeof project["@type"] !== "string") {
      respondWithError(res, 400, 'Project key "@type" must be a string')
      return
    }
    if (project["@type"] !== "Project") {
      respondWithError(res, 400, 'Project key "@type" must be "Project"')
      return
    }
  } else {
    project["@type"] = "Project"
  }

  // Save project and check if it was done correctly
  const logicResult = await logic.saveProject(req.body)
  if (logicResult["_id"]) {
    res.status(201).json(logicResult)
    return
  } else {
    respondWithError(res, logicResult.status, logicResult.message)
    return
  }
}

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
      res.status(200).json(newProject)
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
        return res.status(checkURL.status).json({message: checkURL.message})

      try {
        const result = await ProjectFactory.fromManifestURL(manifestURL, user?.agent)
        res.status(201).json(result)
      } catch (error) {
        res
          .status(error.status ?? 500)
          .json({status: error.status ?? 500, message: error.message})
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

    const projectObj = new Project(id)
    projectObj
      .getById(id)
      .then((userData) => {
        if (!Object.keys(userData).length) {
          return respondWithError(
            res,
            200,
            `No TPEN3 project with ID '${id}' found`
          )
        }
        return res.status(200).json(userData)
      })
      .catch((error) => {
        return respondWithError(
          res,
          error.status || error.code || 500,
          error.message ?? "An error occurred while fetching the user data."
        )
      })
  })
  .all((req, res) => {
    respondWithError(res, 405, "Improper request method. Use GET instead")
  })

router.all((req, res) => {
  respondWithError(res, 405, "Improper request method. Use POST instead")
})

export default router
