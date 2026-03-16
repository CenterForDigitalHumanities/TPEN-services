import express from 'express'
import cors from 'cors'
import auth0Middleware from "../auth/index.js"
import screenContentMiddleware from '../utilities/checkIfSuspicious.js'
import { isSuspiciousJSON } from '../utilities/checkIfSuspicious.js'
import common_cors from '../utilities/common_cors.json' with {type: 'json'}
import { respondWithError, findLineInPage, updatePageAndProject, findPageById, handleVersionConflict, withOptimisticLocking } from '../utilities/shared.js'
import Line from '../classes/Line/Line.js'
import Column from '../classes/Column/Column.js'
import Project from '../classes/Project/Project.js'
import { ACTIONS, ENTITIES, SCOPES } from '../project/groups/permissions_parameters.js'

const router = express.Router({ mergeParams: true })

router.use(cors(common_cors))

// Load Line as temp line or from RERUM
router.get('/:lineId', async (req, res) => {
  const { projectId, pageId, lineId } = req.params
  if (!(projectId && pageId && lineId)) {
    return respondWithError(res, 400, 'Project ID, Page ID, and Line ID are required.')
  }
  try {
    const project = await Project.getById(projectId)
    if (!project?.data) return respondWithError(res, 404, `Project ${projectId} was not found`)
    const pageContainingLine = project.data.layers
      .flatMap(layer => layer.pages)
      .find(page => findLineInPage(page, lineId))

    if (!pageContainingLine) {
      return respondWithError(res, 404, `Line with ID '${lineId}' not found in Page '${pageId}'`)
    }
    const lineRef = findLineInPage(pageContainingLine, lineId)
    if (!lineRef) {
      return respondWithError(res, 404, `Line with ID '${lineId}' not found in Page '${pageId}'`)
    }
    const line = new Line(lineRef)
    if (req.query.text === 'blob') {
      const textBlob = await line.asTextBlob()
      return res.status(200).type('text/plain; charset=utf-8').send(textBlob)
    }
    const lineJson = await line.asJSON(true)
    res.status(200).json(lineJson)
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message)
  }
})

// Add a new line/lines to an existing Page, save it in RERUM if it has body content.
router.post('/', auth0Middleware(), async (req, res) => {
  const user = req.user
  if (!user) return respondWithError(res, 401, "Not authenticated. Please provide a valid, unexpired Bearer token")
  try {
    const project = new Project(req.params.projectId)
    if (!(await project.checkUserAccess(user._id, ACTIONS.CREATE, SCOPES.ALL, ENTITIES.LINE))) {
      return respondWithError(res, 403, 'You do not have permission to create lines in this project')
    }
    if (!project?.data) return respondWithError(res, 404, `Project ${req.params.projectId} was not found`)
    const page = await findPageById(req.params.pageId, req.params.projectId, project)

    if (!req.body || (Array.isArray(req.body) && req.body.length === 0)) {
      return respondWithError(res, 400, "Request body with line data is required")
    }
    const inputLines = Array.isArray(req.body) ? req.body : [req.body]
    // Check each annotation for suspicious content.  The body itself will be checked during the recursion.
    for (const anno of inputLines) {
      if (isSuspiciousJSON(anno, [], true, 1)) {
        return respondWithError(res, 400, "Suspicious input will not be processed.")
      }
    }
    let newLine
    // This feels like a use case for /bulkCreate in RERUM.  Make all these lines with one call.
    for (const lineData of inputLines) {
      newLine = Line.build(req.params.projectId, req.params.pageId, { ...lineData }, user.agent.split('/').pop())
      const existingLine = findLineInPage(page, newLine.id)
      if (existingLine) {
        return respondWithError(res, 409, `Line with ID '${newLine.id}' already exists in page '${req.params.pageId}'`)
      }
      const savedLine = await newLine.update()
      page.items.push(savedLine)
    }
    const pageId = req.params.pageId.split('/').pop()
    const pageProject = project.data.layers.flatMap(layer => layer.pages).find(p => p.id.split('/').pop() === pageId)
    const saveWholeColumns = pageProject?.columns
    await withOptimisticLocking(
      () => updatePageAndProject(page, project, user._id),
      (currentVersion) => {
        if(!currentVersion || currentVersion.type !== 'AnnotationPage') {
          return respondWithError(res, 409, 'Version conflict while updating the page. Please try again.')
        }
        currentVersion.items = [...(currentVersion.items ?? []), ...(page.items ?? [])]
        Object.assign(page, currentVersion)
        return updatePageAndProject(page, project, user._id)
    })
    if (res.headersSent) return
    // Updating the project again to save updated columns as columns is not handled in updatePageAndProject
    if(saveWholeColumns) {
      project.data.layers.flatMap(layer => layer.pages).find(p => p.id.split('/').pop() === pageId).columns = saveWholeColumns
      await project.update()
    }
    const lineJson = await newLine.asJSON(true)
    res.status(201).json(lineJson)
  } catch (error) {
    if (res.headersSent) return
    // Handle version conflicts with optimistic locking
    if (error.status === 409) {
      return handleVersionConflict(res, error)
    }
    return respondWithError(res, error.status ?? 500, error.message ?? 'Internal Server Error')
  }
})

// Update an existing line, including in RERUM
router.put('/:lineId', auth0Middleware(), screenContentMiddleware(), async (req, res) => {
  const user = req.user
  if (!user) return respondWithError(res, 401, "Not authenticated. Please provide a valid, unexpired Bearer token")
  try {
    const project = new Project(req.params.projectId)
    if (!(await project.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.ALL, ENTITIES.LINE))) {
      return respondWithError(res, 403, 'You do not have permission to update lines in this project')
    }
    if (!project?.data) return respondWithError(res, 404, `Project ${req.params.projectId} was not found`)
    const page = await findPageById(req.params.pageId, req.params.projectId, project)
    let oldLine = page.items?.find(l => l.id.split('/').pop() === req.params.lineId?.split('/').pop())
    if (!oldLine) {
      return respondWithError(res, 404, `Line with ID '${req.params.lineId}' not found in page '${req.params.pageId}'`)
    }
    if (!(oldLine.id && oldLine.target && oldLine.body)) oldLine = await fetch(oldLine.id).then(resp => resp.json())
    const line = new Line(oldLine)
    Object.assign(line, req.body)
    const updatedLine = await line.update()
    if (JSON.stringify(oldLine) === JSON.stringify(updatedLine)) {
      // No changes made to the line, return the original
      return res.status(304).json({ message: 'No changes made to the line' })
    }
    const lineIndex = page.items.findIndex(l => l.id.split('/').pop() === req.params.lineId?.split('/').pop())
    page.items[lineIndex] = updatedLine

    const pageId = req.params.pageId.split('/').pop()
    const pageProject = project.data.layers.flatMap(layer => layer.pages).find(p => p.id.split('/').pop() === pageId)
    const oldLineInColumn = pageProject?.columns?.find(col => col.lines.includes(oldLine.id))
    const saveWholeColumns = pageProject?.columns
    if (oldLineInColumn) {
      const column = new Column(oldLineInColumn.id)
      const columnData = await column.getColumnData()
      const lineIndexInColumn = columnData.lines.indexOf(oldLine.id)
      if (lineIndexInColumn !== -1) {
        columnData.lines[lineIndexInColumn] = updatedLine.id
        column.data = columnData
        await column.update()
      }
      const columnInPageIndex = saveWholeColumns.findIndex(col => col.lines.includes(oldLine.id))
      if (columnInPageIndex !== -1) {
        saveWholeColumns[columnInPageIndex].lines = saveWholeColumns[columnInPageIndex].lines.map(lineId =>
          lineId === oldLine.id ? updatedLine.id : lineId
        )
      }
    }
    await withOptimisticLocking(
      () => updatePageAndProject(page, project, user._id),
      (currentVersion) => {
        if(!currentVersion || currentVersion.type !== 'AnnotationPage') {
          return respondWithError(res, 409, 'Version conflict while updating the page. Please try again.')
        }
        const newLineIndex = currentVersion.items.findIndex(l => l.id.split('/').pop() === req.params.lineId?.split('/').pop())
        if (newLineIndex === -1) {
          return respondWithError(res, 404, `Line with ID '${req.params.lineId}' not found in page '${req.params.pageId}'`)
        }
        currentVersion.items[newLineIndex] = updatedLine
        Object.assign(page, currentVersion)
        return updatePageAndProject(page, project, user._id)
      }
    )
    if (res.headersSent) return
    // Updating the project again to save updated columns as columns is not handled in updatePageAndProject
    if(saveWholeColumns) {
      project.data.layers.flatMap(layer => layer.pages).find(p => p.id.split('/').pop() === pageId).columns = saveWholeColumns
      await project.update()
    }
    const lineJson = await line.asJSON(true)
    res.status(200).json(lineJson)
  } catch (error) {
    if (res.headersSent) return
    // Handle version conflicts with optimistic locking
    if (error.status === 409) {
      return handleVersionConflict(res, error)
    }
    return respondWithError(res, error.status ?? 500, error.message)
  }
})

// Update the text of an existing line
router.patch('/:lineId/text', auth0Middleware(), screenContentMiddleware(), async (req, res) => {
  const user = req.user
  if (!user) return respondWithError(res, 401, "Not authenticated. Please provide a valid, unexpired Bearer token")
  try {
    const project = new Project(req.params.projectId)
    if (!(await project.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.TEXT, ENTITIES.LINE))) {
      return respondWithError(res, 403, 'You do not have permission to update line text in this project')
    }
    if (!project?.data) return respondWithError(res, 404, `Project ${req.params.projectId} was not found`)
    if (typeof req.body !== 'string') {
      return respondWithError(res, 400, 'Invalid request body. Expected a string.')
    }
    const page = await findPageById(req.params.pageId, req.params.projectId, project)
    const oldLine = page.items?.find(l => l.id.split('/').pop() === req.params.lineId?.split('/').pop())
    if (!oldLine) {
      return respondWithError(res, 404, `Line with ID '${req.params.lineId}' not found in page '${req.params.pageId}'`)
    }
    const line = new Line(oldLine)
    const updatedLine = await line.updateText(req.body, {"creator": user._id})
    const lineIndex = page.items.findIndex(l => l.id.split('/').pop() === req.params.lineId?.split('/').pop())
    page.items[lineIndex] = updatedLine

    const pageId = req.params.pageId.split('/').pop()
    const pageProject = project.data.layers.flatMap(layer => layer.pages).find(p => p.id.split('/').pop() === pageId)
    const oldLineInColumn = pageProject?.columns?.find(col => col.lines.includes(oldLine.id))
    const saveWholeColumns = pageProject?.columns
    if (oldLineInColumn) {
      const column = new Column(oldLineInColumn.id)
      const columnData = await column.getColumnData()
      const lineIndexInColumn = columnData.lines.indexOf(oldLine.id)
      if (lineIndexInColumn !== -1) {
        columnData.lines[lineIndexInColumn] = updatedLine.id
        column.data = columnData
        await column.update()
      }
      const columnInPageIndex = saveWholeColumns.findIndex(col => col.lines.includes(oldLine.id))
      if (columnInPageIndex !== -1) {
        saveWholeColumns[columnInPageIndex].lines = saveWholeColumns[columnInPageIndex].lines.map(lineId =>
          lineId === oldLine.id ? updatedLine.id : lineId
        )
      }
    }
    await withOptimisticLocking(
      () => updatePageAndProject(page, project, user._id),
      (currentVersion) => {
        if(!currentVersion || currentVersion.type !== 'AnnotationPage') {
          if(res.headersSent) return
          return respondWithError(res, 409, 'Version conflict while updating the page. Please try again.')
        }
        const newLineIndex = currentVersion.items.findIndex(l => l.id.split('/').pop() === req.params.lineId?.split('/').pop())
        if (newLineIndex === -1) {
          if(res.headersSent) return
          return respondWithError(res, 404, `Line with ID '${req.params.lineId}' not found in page '${req.params.pageId}'`)
        }
        currentVersion.items[newLineIndex] = updatedLine
        Object.assign(page, currentVersion)
        return updatePageAndProject(page, project, user._id)
      }
    )
    if(res.headersSent) return
    // Updating the project again to save updated columns as columns is not handled in updatePageAndProject
    if(saveWholeColumns) {
      project.data.layers.flatMap(layer => layer.pages).find(p => p.id.split('/').pop() === pageId).columns = saveWholeColumns
      await project.update()
    }
    const lineJson = await line.asJSON(true)
    res.status(200).json(lineJson)
  } catch (error) {
    if (res.headersSent) return
    // Handle version conflicts with optimistic locking
    if (error.status === 409) {
      return handleVersionConflict(res, error)
    }
    return respondWithError(res, error.status ?? 500, error.message)
  }
})

// Update the xywh (bounds) of an existing line
router.patch('/:lineId/bounds', auth0Middleware(), async (req, res) => {
  const user = req.user
  if (!user) return respondWithError(res, 401, "Not authenticated. Please provide a valid, unexpired Bearer token")
  try {
    const project = new Project(req.params.projectId)
    if (!(await project.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.SELECTOR, ENTITIES.LINE))) {
      return respondWithError(res, 403, 'You do not have permission to update line bounds in this project')
    }
    if (!project?.data) return respondWithError(res, 404, `Project ${req.params.projectId} was not found`)
    const isValidBound = v => (Number.isInteger(v) && v >= 0) || (typeof v === 'string' && /^\d+$/.test(v))
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || !isValidBound(req.body.x) || !isValidBound(req.body.y) || !isValidBound(req.body.w) || !isValidBound(req.body.h)) {
      return respondWithError(res, 400, 'Invalid request body. Expected an object with x, y, w, and h as non-negative integers.')
    }
    const bounds = { x: parseInt(req.body.x, 10), y: parseInt(req.body.y, 10), w: parseInt(req.body.w, 10), h: parseInt(req.body.h, 10) }
    const page = await findPageById(req.params.pageId, req.params.projectId, project)
    const findOldLine = page.items?.find(l => l.id.split('/').pop() === req.params.lineId?.split('/').pop())
    if (!findOldLine) {
      return respondWithError(res, 404, `Line with ID '${req.params.lineId}' not found in page '${req.params.pageId}'`)
    }
    let oldLine = await fetch(findOldLine.id).then(resp => resp.json())
    delete oldLine.label
    const line = new Line(oldLine)
    const updatedLine = await line.updateBounds(bounds, { creator: user._id })
    const lineIndex = page.items.findIndex(l => l.id.split('/').pop() === req.params.lineId?.split('/').pop())
    page.items[lineIndex] = updatedLine

    const pageId = req.params.pageId.split('/').pop()
    const pageProject = project.data.layers.flatMap(layer => layer.pages).find(p => p.id.split('/').pop() === pageId)
    const oldLineInColumn = pageProject?.columns?.find(col => col.lines.includes(oldLine.id))
    const saveWholeColumns = pageProject?.columns
    if (oldLineInColumn) {
      const column = new Column(oldLineInColumn.id)
      const columnData = await column.getColumnData()
      const lineIndexInColumn = columnData.lines.indexOf(oldLine.id)
      if (lineIndexInColumn !== -1) {
        columnData.lines[lineIndexInColumn] = updatedLine.id
        column.data = columnData
        await column.update()
      }
      const columnInPageIndex = saveWholeColumns.findIndex(col => col.lines.includes(oldLine.id))
      if (columnInPageIndex !== -1) {
        saveWholeColumns[columnInPageIndex].lines = saveWholeColumns[columnInPageIndex].lines.map(lineId =>
          lineId === oldLine.id ? updatedLine.id : lineId
        )
      }
    }
    await withOptimisticLocking(
      () => updatePageAndProject(page, project, user._id),
      (currentVersion) => {
        if(!currentVersion || currentVersion.type !== 'AnnotationPage') {
          return respondWithError(res, 409, 'Version conflict while updating the page. Please try again.')
        }
        const newLineIndex = currentVersion.items.findIndex(l => l.id.split('/').pop() === req.params.lineId?.split('/').pop())
        if (newLineIndex === -1) {
          return respondWithError(res, 404, `Line with ID '${req.params.lineId}' not found in page '${req.params.pageId}'`)
        }
        currentVersion.items[newLineIndex] = updatedLine
        Object.assign(page, currentVersion)
        return updatePageAndProject(page, project, user._id)
      }
    )
    if (res.headersSent) return
    // Updating the project again to save updated columns as columns is not handled in updatePageAndProject
    if(saveWholeColumns) {
      project.data.layers.flatMap(layer => layer.pages).find(p => p.id.split('/').pop() === pageId).columns = saveWholeColumns
      await project.update()
    }
    const lineJson = await line.asJSON(true)
    res.status(200).json(lineJson)
  } catch (error) {
    if (res.headersSent) return
    // Handle version conflicts with optimistic locking
    if (error.status === 409) {
      return handleVersionConflict(res, error)
    }
    return respondWithError(res, error.status ?? 500, error.message)
  }
})

export default router
