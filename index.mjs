import express from 'express'
import * as utils from './utilities/shared.mjs'

let router = express.Router()

// Send a successful response with a public index.html page
export function respondWithHTML(res){
  res.status(200).sendFile('index.html').end()
}

router
  .get('/', function(req, res, next) {
    respondWithHTML(res)
  }) 
  .all((req, res, next) => {
    utils.respondWithError(res, 404, 'There is nothing for you here.')
 })

export {router as default}