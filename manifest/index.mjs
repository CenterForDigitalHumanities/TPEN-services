/** 
 * Route handler for the /manifest endpoint.
 * 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 * 
 * */

import express from 'express'
import * as logic from './manifest.mjs'
import * as utils from '../utilities/shared.mjs'
import cors from 'cors'

let router = express.Router()
router.use(
  cors({
    "methods" : "GET",
    "allowedHeaders" : [
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
      'X-HTTP-Method-Override'
    ],
    "exposedHeaders" : "*",
    "origin" : "*",
    "maxAge" : "600"
  })
)

// Send a successful response with the appropriate JSON
export function respondWithManifest(res, manifest){
   const id = manifest["@id"] ?? manifest.id ?? null
   res.set("Content-Type", "application/json; charset=utf-8")
   res.location(id)
   res.status(200)
   res.json(manifest)
}

// Send a successful response with the appropriate JSON
export function respondWithCreatedManifest(res, manifest){
   const id = manifest._id ?? null
   res.set("Content-Type", "application/json; charset=utf-8")
   res.location(id)
   res.status(201)
   res.json(manifest)
}

// Handle a post request which creates the Manifest through TinyPen and gives back the created object
router.route('/create')
   .post(async (req, res, next) => {
      const j = req.body
      // This results in JSON no matter what.  Errors look like {status:CODE, message:"ERR_MSG"}
      const result = await logic.createManifest(j)
      if(result["@id"]){
         respondWithCreatedManifest(res, result)
      }
      else{
         utils.respondWithError(res, result.status, result.message)
      }
   })
   .all((req, res, next) => {
      utils.respondWithError(res, 405, 'Improper request method, please use GET.')
   })


// Handle a put request which updates an existing Manifest through TinyPen and gives back the updated object
router.route('/update')
   .put(async (req, res, next) => {
      const j = req.body
      // This results in JSON no matter what.  Errors look like {status:CODE, message:"ERR_MSG"}
      const result = await logic.createManifest(j)
      if(result["@id"]){
         respondWithManifest(res, result)
      }
      else{
         utils.respondWithError(res, result.status, result.message)
      }
   })
   .all((req, res, next) => {
      utils.respondWithError(res, 405, 'Improper request method, please use GET.')
   })

// Handle a post request which queries for existing objects through TinyPen and gives back the matched objects
router.route('/query')
   .post(async (req, res, next) => {
      const j = req.body
      // This results in JSON no matter what.  Errors look like {status:CODE, message:"ERR_MSG"}
      const result = await logic.createManifest(j)
      if(result["@id"]){
         respondWithManifest(res, result)
      }
      else{
         utils.respondWithError(res, result.status, result.message)
      }
   })
   .all((req, res, next) => {
      utils.respondWithError(res, 405, 'Improper request method, please use GET.')
   })

// Expect an /{id} as part of the route, like /manifest/123
router.route('/:id')
   .get(async (req, res, next) => {
      let id = req.params.id
      if(!utils.validateID(id)){
         utils.respondWithError(res, 400, 'The TPEN3 project ID must be a number')
      }
      id = parseInt(id)
      const manifestObj = await logic.findTheManifestByID(id)
      if(manifestObj){
         respondWithManifest(res, manifestObj)
      }
      else{
         utils.respondWithError(res, 404, `TPEN 3 project "${req.params.id}" does not exist.`)
      }
   })
   .all((req, res, next) => {
      utils.respondWithError(res, 405, 'Improper request method, please use GET.')
   })

// Handle lack of an /{id} as part of the route
router.route('/')
   .get((req, res, next) => {
      utils.respondWithError(res, 400, 'Improper request.  There was no project ID.')
   })
   .all((req, res, next) => {
      utils.respondWithError(res, 405, 'Improper request method, please use GET.')
   })

export default router