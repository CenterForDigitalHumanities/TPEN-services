/** Route handler for the /projects endpoint */
import express from 'express'
import * as logic from './projects.mjs'
import * as utils from '../utilities/shared.mjs'
import cors from 'cors'
import auth0Middleware from '../auth/index.mjs'

process.env.AUDIENCE = "provide audience to test"

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
 * Authenticated endpoint to return a list of a user's projects.
 * 
 * @param options A JSON object of options for the project list lookup.
 * @return An unexpanded list of the user's projects. Returns empty list if none found.
 */
export async function respondWithProjects(user, options, res){
  // Set option defaults
  let hasRoles       = options.hasRoles       ?? 'ALL' 
  let exceptRoles    = options.exceptRoles    ?? 'NONE'
  let createdBefore  = options.createdBefore  ?? 'NOW'
  let modifiedBefore = options.modifiedBefore ?? 'NOW'
  let createdAfter   = options.createdAfter   ?? 0
  let modifiedAfter  = options.modifiedAfter  ?? 0
  let fields         = options.fields         ?? ['id', 'title']
  let count          = options.count          ?? false
  let {isPublic, hasCollaborators, tags} = options

  let projects = await logic.getUserProjects(user)
  // if (projects.length > 0) {
  // }

  if (createdBefore === 'NOW') {
    createdBefore = Date.now()
  }
  projects = projects.filter(project => createdAfter < project.created && project.crated < createdBefore)

  if (modifiedBefore === 'NOW') {
    modifiedBefore = Date.now()
  }
  projects = projects.filter(project => modifiedAfter < project.lastModified && project.lastModified < modifiedAfter)

  if (count) {
    // count parameter overrides fields parameter
    projects = projects.length
  } else {
    // get only the fields specified in fields parameter
    // projects = projects.map(project => ({
    // }))
  }

  res.status(200).send(projects)
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