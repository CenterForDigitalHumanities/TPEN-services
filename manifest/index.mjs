/* GET a TPEN3 project manifest.  Returns Bad Request if the project id is not provided. */

import express from 'express'
import * as logic from './manifest.mjs'
import * as utils from '../utilities/shared.mjs'

let router = express.Router()

// Send a successful response with the appropriate JSON
export function respondWithManifest(res, manifest){
   const id = manifest["@id"] ?? manifest.id ?? null
   res.set("Content-Type", "application/json; charset=utf-8")
   res.location(id)
   res.status(200)
   res.json(manifest)
   res.end()
}

// Route performs the job
router.route('/:id')
   .get(async (req, res, next) => {
      let id = req.params.id
      if(!utils.validateProjectID(id)){
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


// Router is set up correctly...
router.route('/')
   .get((req, res, next) => {
      utils.respondWithError(res, 400, 'Improper request.  There was no project ID.')
   })
   .all((req, res, next) => {
      utils.respondWithError(res, 405, 'Improper request method, please use GET.')
   })

export {router as default}