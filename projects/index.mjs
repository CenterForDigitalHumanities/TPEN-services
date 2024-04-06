/** Route handler for the /projects endpoint */
import express from 'express'
import * as logic from './projects.mjs'
import * as utils from '../utilities/shared.mjs'
import cors from 'cors'
import auth0Middleware from '../auth/index.mjs'

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
export async function getUserProjects(options, res){
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
  
  utils.respondWithError(res, 500, 'Server error') // TEMP until function is implemented
}

router
  .route('/')
  .get(auth0Middleware(), (req, res, next) => {
    getUserProjects(req.query, res)
  })
  .all((req, res, next) => {
    utils.respondWithError(res, 405, 'Improper request method, please use GET.')
  })

export default router