/** Route handler for the /projects endpoint */
import express from 'express'
import * as logic from './projects.mjs'
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

/**
 * Authenticated endpoint to return a list of a user's projects.
 * 
 * @param options A JSON object of options for the project list lookup.
 * @return An unexpanded list of the user's projects. Returns empty list if none found.
 */
export async function getUserProjects(options, res){
  utils.respondWithError(res, 500, 'Server error') // TEMP until function is implemented
}

router
  .route('/')
  .get((req, res, next) => {
    getUserProjects(req.query, res)
  })
  .all((req, res, next) => {
    utils.respondWithError(res, 405, 'Improper request method, please use GET.')
  })

export default router