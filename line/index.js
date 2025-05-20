import express from 'express'
import cors from 'cors'
import auth0Middleware from "../auth/index.js"
import common_cors from '../utilities/common_cors.json' with {type: 'json'}
import { respondWithError, getProjectById, getPageById, findLineInPage, updatePageAndProject, findPageById } from '../utilities/shared.js'
import Line from '../classes/Line/Line.js'

const router = express.Router({ mergeParams: true })

router.use(cors(common_cors))

// Load Line as temp line or from RERUM
router.route('/:lineId')
  .get(async (req, res) => {
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
      const projectData = (await getProjectById(projectId)).data
      if (!projectData) {
        respondWithError(res, 404, `Project with ID '${projectId}' not found`)
        return
      }
      const pageContainingLine = projectData.layers
        .flatMap(layer => layer.pages)
        .find(page => findLineInPage(page, lineId))

      if (!pageContainingLine) {
        respondWithError(res, 404, `Page with ID '${pageId}' not found in project '${projectId}'`)
        return
      }
      const lineRef = findLineInPage(pageContainingLine, lineId)
      const line = (lineRef.id ?? lineRef).startsWith?.(process.env.RERUMIDPREFIX)
        ? await fetch(lineRef.id ?? lineRef).then(res => res.json())
        : new Line({ lineRef })
      res.json(line?.asJSON?.(true))
    } catch (error) {
      res.status(error.status ?? 500).json({ error: error.message })
    }
  })

// Add a new line/lines to an existing Page, save it in RERUM if it has body content.
router.route('/')
  .post(auth0Middleware(), async (req, res) => {
    try {
      const project = await getProjectById(req.params.projectId, res)
      if (!project) return
      const page = await getPageById(req.params.pageId, req.params.projectId, res)
      if (!page) return
 
      const inputLines = Array.isArray(req.body) ? req.body : [req.body]
      let newLine
 
      for (const lineData of inputLines) {
        newLine = Line.build(req.params.projectId, req.params.pageId, { ...lineData })
 
        const existingLine = findLineInPage(page, newLine.id, res)
        if (existingLine) {
          respondWithError(res, 409, `Line with ID '${newLine.id}' already exists in page '${req.params.pageId}'`)
          return
        }
 
        const savedLine = await newLine.update()
        page.items.push(savedLine)
      }
      await updatePageAndProject(page, project, res)

      res.status(201).json(newLine.asJSON(true))
    } catch (error) {
      respondWithError(res, error.status ?? 500, error.message ?? 'Internal Server Error')
    }
  })

// Update an existing line, including in RERUM
router.route('/:lineId')
  .put(auth0Middleware(), async (req, res) => {
    try {
      const project = await getProjectById(req.params.projectId)
      const page = await findPageById(req.params.pageId, req.params.projectId)
      let oldLine = page.items?.find(l => l.id.split('/').pop() === req.params.lineId?.split('/').pop())
      if (!oldLine) {
        respondWithError(res, 404, `Line with ID '${req.params.lineId}' not found in page '${req.params.pageId}'`)
        return
      }
      if (!(oldLine.id && oldLine.target && oldLine.body)) oldLine = await fetch(oldLine.id).then(res => res.json())
      const line = new Line(oldLine)
      Object.assign(line, req.body)
      const updatedLine = await line.update()
      if (JSON.stringify(oldLine) === JSON.stringify(updatedLine)) {
        // No changes made to the line, return the original
        return res.status(304).json({ message: 'No changes made to the line' })
      }
      const lineIndex = page.items.findIndex(l => l.id.split('/').pop() === req.params.lineId?.split('/').pop())
      page.items[lineIndex] = updatedLine
      await page.update()
      const layer = project.data.layers.find(l => l.pages.some(p => p.id.split('/').pop() === req.params.pageId.split('/').pop()))
      const pageIndex = layer.pages.findIndex(p => p.id.split('/').pop() === req.params.pageId.split('/').pop())
      layer.pages[pageIndex] = page.asProjectPage()
      await project.update()
      res.json(line.asJSON(true))
    } catch (error) {
      res.status(error.status ?? 500).json({ error: error.message })
    }
  })

// Update the text of an existing line
router.route('/:lineId/text')
  .patch(auth0Middleware(), async (req, res) => {
    try {
      if (typeof req.body !== 'string') {
        respondWithError(res, 400, 'Invalid request body. Expected a string.')
        return
      }
      const project = await getProjectById(req.params.projectId)
      const page = await findPageById(req.params.pageId, req.params.projectId)
      const oldLine = page.items?.find(l => l.id.split('/').pop() === req.params.lineId?.split('/').pop())
      if (!oldLine) {
        respondWithError(res, 404, `Line with ID '${req.params.lineId}' not found in page '${req.params.pageId}'`)
        return
      }
      const line = new Line(oldLine)
      const updatedLine = await line.updateText(req.body)
      const lineIndex = page.items.findIndex(l => l.id.split('/').pop() === req.params.lineId?.split('/').pop())
      page.items[lineIndex] = updatedLine
      await page.update()
      const layer = project.data.layers.find(l => l.pages.some(p => p.id.split('/').pop() === req.params.pageId.split('/').pop()))
      const pageIndex = layer.pages.findIndex(p => p.id.split('/').pop() === req.params.pageId.split('/').pop())
      layer.pages[pageIndex] = page.asProjectPage()
      await project.update()
      res.json(line.asJSON(true))
    } catch (error) {
      res.status(error.status ?? 500).json({ error: error.message })
    }
  })

// Update the xywh (bounds) of an existing line
router.route('/:lineId/bounds')
  .patch(auth0Middleware(), async (req, res) => {
    try {
      if (typeof req.body !== 'object' || !req.body.x || !req.body.y || !req.body.w || !req.body.h) {
        respondWithError(res, 400, 'Invalid request body. Expected an object with x, y, w, and h properties.')
        return
      }
      const project = await getProjectById(req.params.projectId)
      const page = await findPageById(req.params.pageId, req.params.projectId)
      const oldLine = page.items?.find(l => l.id.split('/').pop() === req.params.lineId?.split('/').pop())
      if (!oldLine) {
        respondWithError(res, 404, `Line with ID '${req.params.lineId}' not found in page '${req.params.pageId}'`)
        return
      }
      const line = new Line(oldLine)
      const updatedLine = await line.updateBounds(req.body)
      const lineIndex = page.items.findIndex(l => l.id.split('/').pop() === req.params.lineId?.split('/').pop())
      page.items[lineIndex] = updatedLine
      await page.update()
      const layer = project.data.layers.find(l => l.pages.some(p => p.id.split('/').pop() === req.params.pageId.split('/').pop()))
      const pageIndex = layer.pages.findIndex(p => p.id.split('/').pop() === req.params.pageId.split('/').pop())
      layer.pages[pageIndex] = page.asProjectPage()
      await project.update()
      res.json(line.asJSON(true))
    } catch (error) {
      res.status(error.status ?? 500).json({ error: error.message })
    }
  })

export default router
