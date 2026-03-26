/** 
 * Route handler for the site index.  Return the landing page index.html.
 * 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 * 
 * */

import express from 'express'
import { respondWithError } from './utilities/shared.js'

let router = express.Router()

// Send a successful response with a public index.html page
export function respondWithHTML(res) {
  res.status(200).sendFile('index.html').end()
}

router
  .route("/")
  .get(function (_req, res, next) {
    respondWithHTML(res)
  })
  .all((_req, res, next) => {
    return respondWithError(res, 404, 'There is nothing for you here.')
  })

export { router as default }
