import express from 'express'
import * as utils from '../utilities/shared.mjs'
import * as service from './userProfile.mjs'
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



router.route('/:id?')
  .get(async (req, res, next) => {
    let id = req.params.id
    if (!id) {
      utils.respondWithError(res, 400, 'No user ID provided')
      return
    }
      if (!utils.validateID(id)) {
          utils.respondWithError(res, 400, 'The TPEN3 page ID must be a number')
        return
      }
      id = parseInt(id)
      const userObject = await service.findUserById(id)
      if (userObject) {
        respondWithUserProfile(res, userObject);
      }
      else {
        utils.respondWithError(res, 404, `TPEN3 user "${id}" does not exist.`)
      }
    })

//post handler
.post(async (req, res, next) => {
  // open for future Modifications as needed
  utils.respondWithError(res, 405, 'Improper request method, please use GET.')
})
///put handler
.put(async (req, res, next) => {
  // open for future Modifications as needed
  utils.respondWithError(res, 405, 'Improper request method, please use GET.')
})

.all((req, res, next) => {
  utils.respondWithError(res, 405, 'Improper request method, please use GET.')
})




function respondWithUserProfile(res, userObject) {
  res.set('Content-Type', 'application/json; charset=utf-8')
  res.status(200).json(userObject)
}



export default router