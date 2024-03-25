import express from 'express'
import * as logic from './project.mjs'
import * as utils from '../utilities/shared.mjs'
import cors from 'cors'

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

// Send a successful response with the appropriate JSON
export function respondWithProject(res, project) {
  const id = project['@id'] ?? project.id ?? null
  res.set('Content-Type', 'application/json; charset=utf-8')
  res.location(id)
  res.status(200)
  res.json(project)
}

export function respondWithUser(res, user) {
  const id = user['@id'] ?? user.id ?? null
  res.set('Content-Type', 'application/json; charset=utf-8')
  res.location(id)
  res.status(200)
  res.json(user)
}

// Define the /user endpoint
router
  .route('/user/:ID')
  .get(async (req, res, next) => {
    let ID = req.params.ID
    // Assuming validateID function exists in the utils module
    if (!utils.validateID(ID)) {
      utils.respondWithError(res, 400, 'The TPEN3 user ID must be a number')
    }
    ID = parseInt(ID)
    // Assuming getUserProfile function exists in the logic module
    const userProfile = await logic.getUserProfile(ID)
    if (userProfile) {
      // Assuming respondWithUser function exists in the router module
      respondWithUser(res, userProfile)
    } else {
      // Assuming respondWithError function exists in the utils module
      utils.respondWithError(res, 404, `TPEN 3 user "${req.params.ID}" does not exist.`)
    }
  })
  .all((req, res, next) => {
    utils.respondWithError(res, 405, 'Improper request method, please use GET.')
  })

// Expect an /{id} as part of the route, like /project/123
router
  .route('/:id')
  .get(async (req, res, next) => {
    let id = req.params.id
    if (!utils.validateID(id)) {
      utils.respondWithError(res, 400, 'The TPEN3 project ID must be a number')
    }
    id = parseInt(id)
    const projectObj = await logic.findTheProjectByID(id)
    if (projectObj) {
      respondWithProject(res, projectObj)
    } else {
      utils.respondWithError(res, 404, `TPEN 3 project "${req.params.id}" does not exist.`)
    }
  })
  .all((req, res, next) => {
    utils.respondWithError(res, 405, 'Improper request method, please use GET.')
  })

// Handle lack of an /{id} as part of the route
router
  .route('/')
  .get((req, res, next) => {
    utils.respondWithError(res, 400, 'Improper request.  There was no project ID.')
  })
  .all((req, res, next) => {
    utils.respondWithError(res, 405, 'Improper request method, please use GET.')
  })

export default router
