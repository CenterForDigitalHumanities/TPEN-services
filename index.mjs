import express from 'express'
import * as utils from './utilities/shared.mjs'

let router = express.Router()

// Send a successful response with a text message (not an HTML page yet)
export function respondWithHTML(res){
  res.sendFile('index.html')
}

router
  .get('/', function(req, res, next) {
    respondWithHTML(res)
  }) 
  .all((req, res, next) => {
    utils.respondWithError(res, 404, 'There is nothing for you here.')
 })

export {router as default}