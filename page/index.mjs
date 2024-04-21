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
        respondWithPage(res, pageObject)
      } else {
        utils.respondWithError(res, 404, `TPEN3 page "${id}" does not exist.`)
      }
    } else {
      utils.respondWithError(res, 400, 'No page ID provided')
    }
  })
  .all((req, res, next) => {
    utils.respondWithError(res, 405, 'Improper request method, please use GET.')
  })


router.post('/:id/appendLine', async (req, res) => {
  try {
    const annotation = await service.appendLine(req.body)
    return res.status(201).json(annotation)
  } catch (error) {
    console.error('Error appending line to page:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})


router.post('/:id/prependLine', async (req, res) => {
  try {
    const annotation = await service.prependLine(req.body)
    return res.status(201).json(annotation)
  } catch (error) {
    console.error('Error appending line to page:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

function respondWithPage(res, pageObject) {
  res.set('Content-Type', 'application/json; charset=utf-8')
  res.status(200).json(pageObject)
}

export default router