import express from 'express'
import * as utils from '../utilities/shared.mjs'
import * as service from './page.mjs'
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
      'X-HTTP-Method-Override'
    ],
    exposedHeaders: '*',
    origin: '*',
    maxAge: '600'
  })
)

// Handle a post create which creates the JSON and sends back the id
router.route('/read')
   .post(async (req, res, next) => {
      const j = req.body
      const result = await service.readPage(j)
      console.log(result)
      res.set('Content-Type', 'application/json; charset=utf-8')
      res.status(200)
      res.json(result)
   })
   .all((req, res, next) => {
      utils.respondWithError(res, 405, 'Improper request method, please use POST.')
   })

router.route('/:id?')
  .get(async (req, res, next) => {
    let id = req.params.id

    if (id) {
      if (!utils.validateID(id)) {
        utils.respondWithError(res, 400, 'The TPEN3 page ID must be a number')
        return
      }
      id = parseInt(id)
      const pageObject = await service.findPageById(id)
      if (pageObject) {
        respondWithPage(res, pageObject);
      } else {
        utils.respondWithError(res, 404, `TPEN3 page "${id}" does not exist.`)
      }
    } else {
      utils.respondWithError(res, 400, 'No page ID provided')
    }
  })
  .all((req, res, next) => {
    utils.respondWithError(res, 405, 'Improper request method, please use GET.')
  });

// Send a successful response with the appropriate JSON
export function respondWithCreatedPage(res, page){
   const id = page._id ?? null
   res.set("Content-Type", "application/json; charset=utf-8")
   res.location(id)
   res.status(201)
   res.json(page)
}


function respondWithPage(res, pageObject) {
  res.set('Content-Type', 'application/json; charset=utf-8')
  res.status(200).json(pageObject)
}

export default router
