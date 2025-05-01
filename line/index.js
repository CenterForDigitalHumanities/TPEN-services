import express from 'express'
import cors from 'cors'
import { Line } from '../classes/Line/Line.js'
import common_cors from '../utilities/common_cors.json' with {type: 'json'}
import { respondWithError } from '../utilities/shared.js'
import auth0Middleware from '../auth/index.js'


const router = express.Router({ mergeParams: true })

router.use(
  cors(common_cors)
)

// Load Line as temp line or from RERUM
router.get('/:lineId', async (req, res) => {
  const { projectId, pageId, lineId } = req.params
  if (!lineId) {
    respondWithError(res, 400, 'Line ID is required.')
    return
  }
  if (!projectId || !pageId) {
    respondWithError(res, 400, 'Project ID and Page ID are required.')
    return
  }
  try {
    if (lineId.startsWith(process.env.RERUMIDPREFIX)) {
      return fetch(lineId).then(res => res.json())
    }
    const projectData = (await Project.getById(projectId)).data
    if (!projectData) {
      respondWithError(res, 404, `Project with ID '${projectId}' not found`)
      return
    }
    const pageContainingLine = projectData.layers
      .flatMap(layer => layer.pages)
      .find(page => page.id.split('/').pop() === pageId.split('/').pop())

    if (!pageContainingLine) {
      respondWithError(res, 404, `Page with ID '${pageId}' not found in project '${projectId}'`)
      return
    }
    const pageObject = pageContainingLine.id.startsWith(process.env.RERUMIDPREFIX) 
      ? await fetch(pageId).then(res => res.json())
      : new Page({ pageContainingLine })
    const lineRef = (pageObject.lines ?? pageObject.items).find(line => line.id.split('/').pop() === lineId.split('/').pop())
    if (!lineRef) {
      respondWithError(res, 404, `Line with ID '${lineId}' not found in page '${pageContainingLine.id}'`)
      return
    }
    const line = lineRef.id.startsWith(process.env.RERUMIDPREFIX)
    ? await fetch(lineRef.id).then(res => res.json())
    : new Line({ lineRef })
    res.json(line?.asJSON?.(true))
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message })
  }
})

// Create temp Line until saved to RERUM
router.post('/:line', auth0Middleware(), async (req, res) => {
  try {
    const newLine = Line.build({ id: req.params.line, ...req.body })
    const savedLine = await newLine.save()
    res.status(201).json(savedLine.asJSON(true))
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message })
  }
})

// Update an existing line, including in RERUM
router.put('/:line', auth0Middleware(), async (req, res) => {
  try {
    const line = new Line({ id: req.params.line })
    const updatedLine = await line.update(req.body)
    res.json(updatedLine.asJSON(true))
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message })
  }
})

// Update the text of an existing line
router.patch('/:line/text', auth0Middleware(), async (req, res) => {
  try {
    const line = new Line({ id: req.params.line })
    const updatedText = await line.updateText(req.body)
    res.json(updatedText.asJSON(true))
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message })
  }
})

// Update the xywh (bounds) of an existing line
router.patch('/:line/bounds', auth0Middleware(), async (req, res) => {
  try {
    const line = new Line({ id: req.params.line })
    const updatedBounds = await line.updateBounds(req.body)
    res.json(updatedBounds.asJSON(true))
  } catch (error) {
    res.status(error.status ?? 500).json(error.message)
  }
})

export default router
