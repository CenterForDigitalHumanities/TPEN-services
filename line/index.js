import express from 'express'
import * as utils from '../utilities/shared.js'
import cors from 'cors'
import Line from '../classes/Line/Line.js'
import common_cors from '../utilities/common_cors.json' with {type: 'json'}

const router = express.Router()

router.use(
  cors(common_cors)
)

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
