/** Route handler for the /projects endpoint */
import express from 'express'
import * as logic from './projects.mjs'
import * as utils from '../utilities/shared.mjs'
import cors from 'cors'
import auth0Middleware from '../auth/index.mjs'
import dotenv from 'dotenv'
import common_cors from '../utilities/common_cors.json' assert {type: 'json'}
dotenv.config()

let router = express.Router()
router.use(
  cors(common_cors)
)

/**
 * Validates queries for /projects endpoint.
 * 
 * @param queries A JSON object of query parameters for the project list lookup.
 * @return An array containing a boolean (true for validated) and an error message, if any.
 */
function validateQueries({ hasRoles, exceptRoles, createdBefore, modifiedBefore, createdAfter, modifiedAfter, fields, count, isPublic, hasCollaborators, tags }) {
  let validation = [true, '']
  if (!(typeof hasRoles === 'string' || Array.isArray(hasRoles)))
    validation = [false, 'hasRoles must be either "ALL" or a list of roles.']
  
  else if (!(typeof exceptRoles === 'string' || Array.isArray(exceptRoles)))
    validation = [false, 'exceptRoles must be either "NONE" or a list of roles.']
  
  else if (createdBefore && !(parseInt(createdBefore) !== NaN || createdBefore === 'NOW'))
    validation = [false, 'createdBefore must be either "NOW" or a date in UNIX time.']
  
  else if (modifiedBefore && !(parseInt(modifiedBefore) !== NaN || modifiedBefore === 'NOW'))
    validation = [false, 'modifiedBefore must be either "NOW" or a date in UNIX time.']
  
  else if (createdAfter && parseInt(createdAfter) === NaN)
    validation = [false, 'createdAfter must be a date in UNIX time.']
  
  else if (modifiedAfter && parseInt(modifiedAfter) === NaN)
    validation = [false, 'modifiedAfter must be a date in UNIX time.']
  
  else if (!(typeof fields === 'string' || Array.isArray(fields)))
    validation = [false, 'fields must be an array of string fields.']
  
  else if (count && !(count === 'true' || count === 'false')) 
    validation = [false, 'count must be a boolean.']
  
  else if (isPublic && !(isPublic === 'true' || isPublic === 'false'))
    validation = [false, 'isPublic must be a boolean or left undefined.']
  
  else if (hasCollaborators && !(hasCollaborators === 'true' || hasCollaborators === 'false'))
    validation = [false, 'hasCollaborators must be a boolean or left undefined.']
  
  else if (tags && !Array.isArray(tags))
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
  const count          = options.count          ?? 'false' // count query is read as a string
  const {isPublic, hasCollaborators, tags} = options // isPublic and hasCollaborators, while representing booleans, are also read as strings

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
    utils.respondWithError(res, 400, validation[1])
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

  // TODO: `isPublic`, `modifiedBefore`, `hasCollaborators`, and `tags` queries 

  if (count === 'true') {
    res.status(200)
      .set('Content-Type', 'text/plain; charset=utf-8')
      .send(projects.length.toString())
    return
  }
  // TODO: get only the fields specified in fields parameter
  projects = projects.map(project => ({"id": project.id, "title": project.title})) // TEMP until other fields implemented

  res.status(200).json(projects)
}

router
  .route('/')
  .get(auth0Middleware(), (req, res, next) => {
    respondWithProjects(req.user?.["http://store.rerum.io/agent"] ?? 404, req.query, res)
  })
  .all((req, res, next) => {
    utils.respondWithError(res, 405, 'Improper request method, please use GET.')
  })

export default router
