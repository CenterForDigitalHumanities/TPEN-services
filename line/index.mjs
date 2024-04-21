import express from 'express'
import * as utils from '../utilities/shared.mjs'
import cors from 'cors'
import * as logic from './line.mjs'

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
      return utils.respondWithError(res, 500, 'Internal Server Error')
    }
  })

router.route('/')
  .get((req, res, next) => {
    return utils.respondWithError(res, 400, 'Improper request.  There was no line ID.')
  })

// I am using the below route for testing  and retriving the Annotation as mentioned as issue to check
router.get('/:id/retrive', async (req, res) => {
  const id = req.params.id
  const siblingAnnotation = await logic.findingSiblingAnnotation(id)
  return res.status(201).json(siblingAnnotation)
})


router.post('/:id/after', async (req, res) => {
  try {
    const id = req.params.id
    const siblingAnnotation = await logic.findingSiblingAnnotation(id)
    if (!Array.isArray(siblingAnnotation) || siblingAnnotation.length === 0) {
      return res.status(404).json({ error: 'Line ${id} does not exist.' })
    }
    const response = await logic.insertLineinAnnotationPage(req.body, siblingAnnotation[0])
    return res.status(201).json(response)
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/:id/before', async (req, res) => {
  try {
    const id = req.params.id
    const siblingAnnotation = await logic.findingSiblingAnnotation(id)
    if (!Array.isArray(siblingAnnotation) || siblingAnnotation.length === 0) {
      return res.status(404).json({ error: 'Line ${id} does not exist. '})
    }
    const response = await logic.insertLineBeforeAnnotation(req.body, siblingAnnotation[0])
    return res.status(201).json(response)
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})
 
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id
    const siblingAnnotation = await logic.findingSiblingAnnotation(id)
    if (!Array.isArray(siblingAnnotation) || siblingAnnotation.length === 0) {
      return res.status(404).json({ error: 'Line ${id} does not exist. '})
    }
    logic.deleteLineFromAnnotation(req.body, siblingAnnotation[0])
    return res.status(204).json({"message": "Line deleted from annotion"})
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id
    const siblingAnnotation = await logic.findingSiblingAnnotation(id)
    if (!Array.isArray(siblingAnnotation) || siblingAnnotation.length === 0) {
      return res.status(404).json({ error: 'Line ${id} does not exist. '})
    }
    const updatedLine = req.body
    await logic.updateLineInAnnotation(updatedLine, siblingAnnotation[0])
    return res.status(200).json({ message: 'Line ${id} updated successfully.' })
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

function respondWithLine(res, lineObject) {
  res.set('Content-Type', 'application/json; charset=utf-8')
  res.status(200).json(lineObject)
}


export default router