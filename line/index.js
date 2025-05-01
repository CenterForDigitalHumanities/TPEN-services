import express from 'express'
import cors from 'cors'
import { Line } from '../classes/Line/Line.js'
import common_cors from '../utilities/common_cors.json' with {type: 'json'}

const router = express.Router({mergeParams: true})

router.use(
  cors(common_cors)
)

function respondWithLine(res, lineObject) {
  res.set('Content-Type', 'application/json; charset=utf-8')
  res.status(200).json(lineObject)
}

// Load Line as temp line or from RERUM
router.get('/:line', async (req, res) => {
  try {
    const line = new Line({ id: req.params.line })
    const loadedLine = await line.load()
    res.json(loadedLine?.asJSON())
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message })
  }
})

// Create temp Line until saved to RERUM
router.post('/:line', async (req, res) => {
  try {
    const newLine = Line.build({ id: req.params.line, ...req.body })
    const savedLine = await newLine.save()
    res.status(201).json(savedLine.asJSON())
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message })
  }
})

// Update an existing line, including in RERUM
router.put('/:line', async (req, res) => {
  try {
    const line = new Line({ id: req.params.line })
    const updatedLine = await line.update(req.body)
    res.json(updatedLine.asJSON())
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message })
  }
})

// Update the text of an existing line
router.patch('/:line/text', async (req, res) => {
  try {
    const line = new Line({ id: req.params.line })
    const updatedText = await line.updateText(req.body)
    res.json(updatedText.asJSON())
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message })
  }
})

// Update the xywh (bounds) of an existing line
router.patch('/:line/bounds', async (req, res) => {
  try {
    const line = new Line({ id: req.params.line })
    const updatedBounds = await line.updateBounds(req.body)
    res.json(updatedBounds.asJSON())
  } catch (error) {
    res.status(error.status ?? 500).json( error.message )
  }
})

export default router
