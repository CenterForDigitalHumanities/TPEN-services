/** 
 * Route handler for the site index.  Return the landing page index.html.
 * 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 * 
 * */

import express from 'express'
import * as utils from './utilities/shared.js'

let router = express.Router()

// Send a successful response with a public index.html page
export function respondWithHTML(res) {
  res.status(200).sendFile('index.html').end()
}

import { JSDOM } from 'jsdom'
import DOMPurify from 'dompurify'

const window = new JSDOM('').window
const purify = DOMPurify(window)

import fs from 'fs'
import { marked } from 'marked'

marked.use({
  gfm: true,
})

router
  .route("/api")
  .get(function (_req,res) {
    fs.readFile('API.md', 'utf8', (err, data) => {
      if (err) {
        utils.respondWithError(res, 500, 'Failed to read API.md')
        return
      }
      res.format({
        html: () => res.send(makeCleanFileFromMarkdown(data))
      })
    })
  })

router
  .route("/")
  .get(function (_req, res, next) {
    respondWithHTML(res)
  })
  .all((_req, res, next) => {
    utils.respondWithError(res, 404, 'There is nothing for you here.')
  })

export { router as default }

function makeCleanFileFromMarkdown(file) {
  const sanitizedContent = purify.sanitize(marked.parse(file))
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="http://localhost:4001/assets/css/main.css">
      <title>API Documentation</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/json.min.js"></script>
      <script>hljs.highlightAll()</script>
    </head>
    <body>
      <section id="content" class="wrapper dark">
      ${sanitizedContent}
      </section>
    </body>
    </html>
  `
}
