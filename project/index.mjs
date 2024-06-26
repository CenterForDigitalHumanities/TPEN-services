import express from "express"
import * as utils from "../utilities/shared.mjs"
import * as logic from "./project.mjs"
import DatabaseDriver from "../database/driver.mjs"
import cors from "cors"
import common_cors from "../utilities/common_cors.json" assert {type: "json"}
import auth0Middleware from "../auth/index.mjs"
import ImportProject from "../classes/Project/ImportProject.mjs"

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
    utils.respondWithError(
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
          utils.respondWithError(
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
          utils.respondWithError(
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
          utils.respondWithError(
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
          utils.respondWithError(
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
      utils.respondWithError(
        res,
        400,
        'Project key "created" must be a date in UNIX time'
      )
      return
    }
  } else {
    utils.respondWithError(res, 400, 'Project must have key "created"')
    return
  }
  if (project.license) {
    if (typeof project.license !== "string") {
      utils.respondWithError(res, 400, 'Project key "license" must be a string')
      return
    }
  } else {
    project.license = "CC-BY"
  }
  if (project.title) {
    if (typeof project.title !== "string") {
      utils.respondWithError(res, 400, 'Project key "title" must be a string')
      return
    }
  } else {
    project.title = "Project" + project.creator + project.created.toString() // Create a default title
  }

  // Optional keys
  if (project.tools) {
    if (!Array.isArray(project.tools)) {
      utils.respondWithError(res, 400, 'Project key "tools" must be an array')
      return
    }
  }
  if (project.tags) {
    if (!Array.isArray(project.tags)) {
      utils.respondWithError(res, 400, 'Project key "tags" must be an array')
      return
    }
    if (!project.tags.every((tag) => typeof tag === "string")) {
      utils.respondWithError(
        res,
        400,
        'Project key "tags" must be an array of strings'
      )
      return
    }
  }
  if (project.manifest) {
    if (typeof project.manifest !== "string") {
      utils.respondWithError(
        res,
        400,
        'Project key "manifest" must be a string'
      )
      return
    }
    if (!url.canParse(project.manifest)) {
      utils.respondWithError(
        res,
        400,
        'Project key "manifest" must be a valid URL'
      )
      return
    }
  }
  if (project["@type"]) {
    if (typeof project["@type"] !== "string") {
      utils.respondWithError(res, 400, 'Project key "@type" must be a string')
      return
    }
    if (project["@type"] !== "Project") {
      utils.respondWithError(res, 400, 'Project key "@type" must be "Project"')
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
    utils.respondWithError(res, logicResult.status, logicResult.message)
    return
  }
}

router
  .route("/create")
  .post(async (req, res, next) => {
    // TODO: Add authentication to this endpoint
    if (!utils.isValidJSON(req.body)) {
      utils.respondWithError(res, 400, "Improperly formatted JSON")
      return
    }
    await createNewProject(req, res)
  })
  .all((req, res, next) => {
    utils.respondWithError(
      res,
      405,
      "Improper request method, please use POST."
    )
  })

router.get("/:id", async (req, res, next) => {
  let id = req.params.id
  if (!database.isValidId(id)) {
    utils.respondWithError(
      res,
      400,
      "The TPEN3 project ID must be a hexadecimal string"
    )
    return
  }

  try {
    const projectObj = await logic.findTheProjectByID(id)
    if (projectObj) {
      respondWithProject(req, res, projectObj)
    } else {
      utils.respondWithError(
        res,
        404,
        `TPEN3 project "${req.params.id}" does not exist.`
      )
    }
  } catch (err) {
    utils.respondWithError(
      res,
      500,
      "The TPEN3 server encountered an internal error."
    )
  }
})

router.route("/import/:manifestId").get(auth0Middleware(), async (req, res) => {
  let {manifestId} = req.params
  if (manifestId.startsWith(":")) {
    manifestId = manifestId.slice(1)
  }
  if (!manifestId)
    return res.status(400).json({message: "Manifest ID is required for import"})

  try {
    const result = await ImportProject.fromManifest(manifestId)
    res.status(201).json(result)
  } catch (error) {
    res.status(500).json({status: error.status ?? 500, message: error.message})
  }
})

router.all("/", (req, res, next) => {
  utils.respondWithError(res, 405, "Improper request method, please use GET.")
})

export default router
