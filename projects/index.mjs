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
 * @return An array containing a boolean (true for validated) and an error message, if any.
 */
function validateQueries({queries}) {
  let validation = [true, '']
  if (!(hasRoles === 'NONE' || hasRoles === 'ALL' || Array.isArray(hasRoles)))
    validation = [false, 'hasRoles must be either "NONE" or a list of roles.']
  
  if (!(exceptRoles === 'NONE' || exceptRoles === 'ALL' || Array.isArray(exceptRoles)))
    validation = [false, 'exceptRoles must be either "NONE", "ALL", or a list of roles.']
  
  if (!(typeof createdBefore === 'number' || createdBefore === 'NOW'))
    validation = [false, 'createdBefore must be either "NOW" or a date in UNIX time.']
  
  if (typeof createdAfter !== 'number')
    validation = [false, 'createdAfter must be a date in UNIX time.']
  
  if (typeof modifiedAfter !== 'number')
    validation = [false, 'modifiedAfter must be a date in UNIX time.']
  
  if (!Array.isArray(fields))
    validation = [false, 'fields must be an array of string fields.']
  
  if (typeof count !== 'boolean') 
    validation = [false, 'count must be a boolean.']
  
  if (isPublic && typeof isPublic !== 'boolean')
    validation = [false, 'isPublic must be a boolean or left undefined.']
  
  if (hasCollaborators && typeof hasCollaborators !== 'boolean')
    validation = [false, 'hasCollaborators must be a boolean or left undefined.']
  
  if (tags && !Array.isArray(tags))
    validation = [false, 'tags must be either an array of strings or left undefined.']

  return validation
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
  let createdBefore    = options.createdBefore  ?? 'NOW'
  let modifiedBefore   = options.modifiedBefore ?? 'NOW'
  const createdAfter   = options.createdAfter   ?? 0
  const modifiedAfter  = options.modifiedAfter  ?? 0
  const fields         = options.fields         ?? ['id', 'title']
  const count          = options.count          ?? false
  const {isPublic, hasCollaborators, tags} = options

  const validation = validateQueries({
    "hasRoles": hasRoles,
    "exceptRoles": exceptRoles,
    "createdBefore": createdBefore,
    "modifiedBefore": modifiedBefore,
    "createdAfter": createdAfter,
    "modifiedAfter": modifiedAfter,
    "fields": fields,
    "count": count,
    "isPublic": isPublic,
    "hasCollaborators": hasCollaborators,
    "tags": tags
  })
  if (!validation[0]) {
    utils.respondWithError(400, validation[1])
    return
  }

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