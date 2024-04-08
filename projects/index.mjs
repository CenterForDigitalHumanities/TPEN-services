/** Route handler for the /projects endpoint */
import express from 'express'
import * as logic from './projects.mjs'
import * as utils from '../utilities/shared.mjs'
import cors from 'cors'
import auth0Middleware from '../auth/index.mjs'
import 'dotenv/config'

let router = express.Router()
router.use(
  cors({
    methods: 'GET',
    allowedHeaders: [
      'Content-Type',
      'Content-Length',
      'Allow',
      'Authorization',
      'Location',
      'ETag',
      'Connection',
      'Keep-Alive',
      'Date',
      'Cache-Control',
      'Last-Modified',
      'Link',
      'X-HTTP-Method-Override',
    ],
    exposedHeaders: '*',
    origin: '*',
    maxAge: '600',
  })
)

/**
 * Validates queries for /projects endpoint.
 * 
 * @param queries A JSON object of query parameters for the project list lookup.
 * @return A boolean indicating whether validations passed or failed.
 */
function validateQueries(queries) {

}

/**
 * Authenticated endpoint to return a list of a user's projects.
 * 
 * @param options A JSON object of options for the project list lookup.
 * @return An unexpanded list of the user's projects. Returns empty list if none found.
 */
export async function respondWithProjects(user, options, res){
  // Set option defaults
  const hasRoles       = options.hasRoles       ?? 'ALL' 
  const exceptRoles    = options.exceptRoles    ?? 'NONE'
  let createdBefore  = options.createdBefore  ?? 'NOW'
  let modifiedBefore = options.modifiedBefore ?? 'NOW'
  const createdAfter   = options.createdAfter   ?? 0
  const modifiedAfter  = options.modifiedAfter  ?? 0
  const fields         = options.fields         ?? ['id', 'title']
  const count          = options.count          ?? false
  const {isPublic, hasCollaborators, tags} = options

  let projects = await logic.getUserProjects(user)

  if (hasRoles !== 'ALL') {
    projects = projects.filter(project => (
      project.roles.some(role => hasRoles.includes(role))
    ))
  }
  if (exceptRoles !== 'NONE') {
    projects = projects.filter(project => {
      !project.roles.some(role => exceptRoles.includes(role))
    })
  }

  if (createdBefore === 'NOW') {
    createdBefore = Date.now()
  }
  projects = projects.filter(project => createdAfter < project.created && project.created < createdBefore)

  if (modifiedBefore === 'NOW') {
    modifiedBefore = Date.now()
  }
  projects = projects.filter(project => modifiedAfter < project.lastModified && project.lastModified < modifiedAfter)

  if (count) {
    // count parameter overrides fields parameter
    res.status(200).send(projects.length)
  } else {
    // TODO: get only the fields specified in fields parameter
    projects = projects.map(project => ({"id": project.id, "title": project.title})) // TEMP until other fields implemented
  }

  res.status(200).json(projects)
}

router
  .route('/')
  .get(auth0Middleware(), (req, res, next) => {
    respondWithProjects(req.user, req.query, res)
  })
  .all((req, res, next) => {
    utils.respondWithError(res, 405, 'Improper request method, please use GET.')
  })

export default router