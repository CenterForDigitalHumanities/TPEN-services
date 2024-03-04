import express from 'express'
import * as utils from '../utilities/shared.mjs'
import { findLineById } from './line.mjs'
import cors from 'cors'

const router = express.Router()

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

router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id

    if (!utils.validateID(id)) {
      return utils.respondWithError(res, 400, 'The TPEN3 Line ID must be a number')
    }

    const options = req.query
    const lineObject = await findLineById(id, options)

    if (lineObject !== null) {
      res.status(200).json(lineObject)
    } else {
      return utils.respondWithError(res, 404, `TPEN 3 line "${id}" does not exist.`)
    }
  } catch (error) {
    console.error(error)
    return utils.respondWithError(res, 500, 'Internal Server Error')
  }
})

router.all('/:id', (req, res) => {
  return utils.respondWithError(res, 405, 'Improper request method, please use GET.')
})

export default router