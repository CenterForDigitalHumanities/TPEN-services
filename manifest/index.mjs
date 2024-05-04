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
import common_cors from '../utilities/common_cors.json'

let router = express.Router()
router.use(
  cors(common_cors)
)


/**
 * Do a RESTful HTTP response for a success that happens in the routes below.
 * @param res The Express response object
 * @param code An HTTP response code integer
 * @param data JSON data to send in the response body
 * @param message A message to send in the response body
 */ 
function successfulResponse(res, code, data=null, message=null){
   let data_iri = null
   if(data && !Array.isArray(data)) data_iri = data["@id"] ?? data.id
   if(data_iri) res.location(data_iri)
   res.status(code)
   if(data) {
      res.json(data)
   }
   else if(message) {
      res.send(message)
   }
   else{
      res.send()
   }
}


// Handle a post request which creates the Manifest through TinyPen and gives back the created object
router.route('/create')
   .post(async (req, res, next) => {
      const j = req.body
      const logicResult = await logic.saveManifest(j)
      if(logicResult["@id"]){
         successfulResponse(res, 201, logicResult)
      }
      else{
         utils.respondWithError(res, logicResult.status, logicResult.message)
      }
   })
   .all((req, res, next) => {
      utils.respondWithError(res, 405, 'Improper request method, please use POST.')
   })


// Handle a put request which updates an existing Manifest through TinyPen and gives back the updated object
// Note this may just be an alias for /save
router.route('/update')
   .put(async (req, res, next) => {
      const j = req.body
      const logicResult = await logic.updateManifest(j)
      if(logicResult["@id"]){
         successfulResponse(res, 200, logicResult)
      }
      else{
         utils.respondWithError(res, logicResult.status, logicResult.message)
      }
   })
   .all((req, res, next) => {
      utils.respondWithError(res, 405, 'Improper request method, please use PUT.')
   })

// Handle a post request which queries for existing objects through TinyPen and gives back the matched objects
router.route('/query')
   .post(async (req, res, next) => {
      const j = req.body
      const logicResult = await logic.queryForManifestsByDetails(j)
      if(Array.isArray(logicResult)){
         successfulResponse(res, 200, logicResult)
      }
      else{
         utils.respondWithError(res, logicResult.status, logicResult.message)
      }
   })
   .all((req, res, next) => {
      utils.respondWithError(res, 405, 'Improper request method, please use POST.')
   })

// Handle a delete request which contains the ID of a Manifest to delete.
router.route('/delete/:id')
   .delete(async (req, res, next) => {
      let id = req.params.id
      const logicResult = await logic.deleteManifest(id)
      if(logicResult._dbaction){
         utils.respondWithError(res, logicResult.status, logicResult.message)
      }
      else{
         successfulResponse(res, 204, null, `${id} is marked as deleted`)
         res.status(204)
      }
   })
   .all((req, res, next) => {
      utils.respondWithError(res, 405, 'Improper request method, please use DELETE.')
   })

// Expect a project id /{id} as part of the route, like /manifest/123
router.route('/:id')
   .get(async (req, res, next) => {
      let id = req.params.id
      if(!utils.validateID(id)){
         utils.respondWithError(res, 400, 'The TPEN3 project ID must be a number')
      }
      id = parseInt(id)
      const manifestObj = await logic.findTheManifestByProjectID(id)
      if(manifestObj){
         successfulResponse(res, 200, manifestObj)
      }
      else{
         utils.respondWithError(res, 404, `TPEN 3 project "${req.params.id}" does not exist.`)
      }
   })
   .all((req, res, next) => {
      const id = req.params.id
      utils.respondWithError(res, 405, `Improper request method to get a manifest by project ID '${id}'. please use GET.`)
   })

// Handle lack of an action as part of the route.
router.route('/')
   .all((req, res, next) => {
      utils.respondWithError(res, 404, 'Not found')
   })

export default router