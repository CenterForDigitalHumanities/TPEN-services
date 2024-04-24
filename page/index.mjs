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
    const pageObject = await service.findPageById(id)
    if (pageObject) {
        respondWithPage(res, pageObject)
    } else {
      utils.respondWithError(res, 400, 'No page exsist for this Id')
    }
  })
  .all((req, res, next) => {
    utils.respondWithError(res, 405, 'Improper request method, please use GET.')
  })

/**
 * Route handler for POST requests to append a line to a page.
 */
router.post('/:id/appendLine', async (req, res) => {
  try {
    const id = req.params.id
    const annotation = req.body
    const annotationPage = await service.findPageById(id)
    if (annotationPage.length === 0) {
      return res.status(404).json({ error: 'Page is empty' })
    }
    const updatedAnnotationPage = await service.appendAnnotationToPage(annotation,annotationPage)
    const logicResult = await service.updateAnnotationPage(updatedAnnotationPage)
    if(logicResult["@id"]){
      successfulResponse(res, 200, logicResult)
   }
   else{
      utils.respondWithError(res, logicResult.status, logicResult.message)
   }
  } catch (error) {
    console.error('Error appending line to page:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})
/**
 * Function to send a successful response with optional data or message.
 * @param {object} res - Express response object
 * @param {number} code - HTTP status code
 * @param {object|null} data - Optional data to be sent in the response
 * @param {string|null} message - Optional message to be sent in the response
 */
function successfulResponse(res, code, data=null, message=null){
  let data_iri = null
  if(data && !Array.isArray(data)) data_iri = data["@id"] ?? data.id
  if(data_iri) res.location(data_iri)
  res.status(code)
  if(data) {
     res.json(data)
  }
  else if(message) {
     res.send(message)
  }
  else{
     res.send()
  }
}
/**
 * Route handler for POST requests to prepend a line to a page.
 */
router.post('/:id/prependLine', async (req, res) => {
  try {
    const id = req.params.id
    const annotation = req.body
    const annotationPage = await service.findPageById(id)
    if (annotationPage.length === 0) {
      return res.status(404).json({ error: 'Page is empty' })
    }
    const updatedAnnotationPage = await service.prependAnnotationToPage(annotation,annotationPage)
    console.log(updatedAnnotationPage)
    const logicResult = await service.updateAnnotationPage(updatedAnnotationPage)
    if(logicResult["@id"]){
      successfulResponse(res, 200, logicResult)
   }
   else{
      utils.respondWithError(res, logicResult.status, logicResult.message)
   }
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