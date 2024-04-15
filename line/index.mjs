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
 router.delete('/line/:id', async (req, res, next) => {
  let id = req.params.id
  const result = await logic.deleteLine(id)
  if(result._dbaction){
    utils.respondWithError(res, result.status, result.message)
  }
  else{
    successfulResponse(res, 204, null, `Line ${id} is marked as deleted`)
    res.status(204)
   }
   })
.all((req, res, next) => {
  utils.respondWithError(res, 405, 'Improper request method, please use DELETE.')
})
router.put('/line/:id', async (req, res, next) => {
  const b = req.body
  const result = await logic.updateLine(b)
  if(result["@id"]){
    successfulResponse(res, 200, result)
  }
  else{
    utils.respondWithError(res, result.status, result.message)
  }
})
.all((req, res, next) => {
  utils.respondWithError(res, 405, 'Improper request method, please use PUT.')
})
 
function respondWithLine(res, lineObject) {
  res.set('Content-Type', 'application/json; charset=utf-8')
  res.status(200).json(lineObject)
}


export default router
