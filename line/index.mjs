import express from 'express'
import cors from 'cors'
import * as logic from './line.mjs'
import * as utils from '../utilities/shared.mjs'
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
/**
 * Route to retrieve annotations by line ID
 * Used for testing purposes
 * @param {number} id - The ID of the line to retrieve annotations for
 */
router.get('/:id/retrive', async (req, res) => {
  const id = req.params.id
  const siblingAnnotation = await logic.findingSiblingAnnotation(id)
  return res.status(201).json(siblingAnnotation)
})

/**
 * Route to insert a line after the specified line ID
 * @param {number} id - The ID of the line to insert after
 * @param {object} req.body - The data to insert
 */
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
/**
 * Route to insert a line before the specified line ID
 * @param {number} id - The ID of the line to insert before
 * @param {object} req.body - The data to insert
 */
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
 /**
 * Route to delete a line by ID
 * @param {number} id - The ID of the line to delete
 */
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
/**
 * Route to update a line by ID
 * @param {number} id - The ID of the line to update
 * @param {object} req.body - The updated data
 */
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

router.route('/')
  .get((req, res, next) => {
    return utils.respondWithError(res, 400, 'Improper request. There was no line ID.')
  })
  .all((req, res, next) => {
    return utils.respondWithError(res, 405, 'Improper request method, please use GET.')
  })

export default router
