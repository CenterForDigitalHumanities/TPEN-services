import express from 'express'
import * as utils from '../utilities/shared.mjs'
import cors from 'cors'
import { findLineById } from './line.mjs'

const router = express.Router()

router.use(cors({
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
}))

router.route('/:id')
  .get(async (req, res, next) => {
    try {
      let id = req.params.id

      if (!utils.validateID(id)) {
        return utils.respondWithError(res, 400, 'The TPEN3 Line ID must be a number')
      }

      id = parseInt(id)

      const lineObject = await findLineById(id)

      if (lineObject.statusCode === 404) {
        return utils.respondWithError(res, 404, lineObject.body)
      } 
    } catch (error) {
      console.error(error)
      return utils.respondWithError(res, 500, 'Internal Server Error')
    }
  })
  .all((req, res, next) => {
    return utils.respondWithError(res, 405, 'Improper request method, please use GET.')
  })

router.route('/')
  .get((req, res, next) => {
    return utils.respondWithError(res, 400, 'Improper request.  There was no line ID.')
  })
  .all((req, res, next) => {
    return utils.respondWithError(res, 405, 'Improper request method, please use GET.')
  })

function respondWithLine(res, lineObject) {
  res.set('Content-Type', 'application/json; charset=utf-8')
  res.status(200).json(lineObject)
}

export default router
