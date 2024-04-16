import express from 'express'
import * as utils from '../utilities/shared.mjs'
//import * as service from './userProfile.mjs'
import {User} from "../classes/User/User.mjs"

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
    try{
      const userObject =  new User(id)
      if (userObject) {
        respondWithUserProfile(res, await userObject.getSelf())
      }
      else {
        utils.respondWithError(res, 404, `TPEN3 user "${id}" does not exist.`)
      }
    }
    catch (error) {
      utils.respondWithError(res,500,error.message)
    }  
  })

//post handler
.post(async (req, res, next) => {
  // open for future Modifications as needed
  utils.respondWithError(res, 501, 'Not Implemented, please use GET.')
})

//put handler
.put(async (req, res, next) => {
  // open for future Modifications as needed
  utils.respondWithError(res, 501, 'Not Implemented, please use GET.')
})

.all((req, res, next) => {
  utils.respondWithError(res, 405, 'Improper request method, please use GET.')
})

function respondWithUserProfile(res, userObject) {
  res.set('Content-Type', 'application/json; charset=utf-8')
  res.status(200).json(userObject)
}

export default router