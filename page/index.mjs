import express from 'express'
import * as utils from '../utilities/shared.mjs'
import * as service from './page.mjs'
import cors from 'cors'
import common_cors from '../utilities/common_cors.json' with {type: 'json'}

let router = express.Router()

router.use(
  cors(common_cors)
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

function respondWithPage(res, pageObject) {
  res.set('Content-Type', 'application/json; charset=utf-8')
  res.status(200).json(pageObject)
}

export default router
