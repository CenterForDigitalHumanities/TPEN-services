import express from 'express'
import cors from 'cors'
import auth0Middleware from "../auth/index.js"
import screenContentMiddleware from '../utilities/checkIfSuspicious.js'
import { isSuspiciousJSON } from '../utilities/checkIfSuspicious.js'
import common_cors from '../utilities/common_cors.json' with {type: 'json'}
import { respondWithError, getProjectById, findLineInPage, updatePageAndProject, findPageById, handleVersionConflict, withOptimisticLocking } from '../utilities/shared.js'
import Line from '../classes/Line/Line.js'

const router = express.Router({ mergeParams: true })

router.use(cors(common_cors))

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
      const resolved = await fetch(lineId)
        .then(resp => {
          if (resp.ok) return resp.json()
          else {
            return {"code": resp.status ?? 500, "message": resp.statusText ?? `Communication error with RERUM`}
          }
        }).catch(err => {
          return {"code": 500, "message": `Communication error with RERUM`}
        })
        if (resolved.id || resolved["@id"]) return res.json(resolved)
        else return respondWithError(res, resolved.code, resolved.message)
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
router.post('/', auth0Middleware(), async (req, res) => {
  const user = req.user
  if (!user) return respondWithError(res, 401, "Unauthenticated request")
  try {
    const project = await getProjectById(req.params.projectId, res)
    if (!project) return
    const page = await findPageById(req.params.pageId, req.params.projectId)
    if (!page) return

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
      const existingLine = findLineInPage(page, newLine.id, res)
      if (existingLine) {
        respondWithError(res, 409, `Line with ID '${newLine.id}' already exists in page '${req.params.pageId}'`)
        return
      }
      const savedLine = await newLine.update()
      page.items.push(savedLine)
    }
    const ifNewContent = (page.items && page.items.length)
    await withOptimisticLocking(
      () => updatePageAndProject(page, project, user._id, ifNewContent),
      (currentVersion) => {
        if(!currentVersion || currentVersion.type !== 'AnnotationPage') {
          respondWithError(res, 409, 'Version conflict while updating the page. Please try again.')
          return
        }
        currentVersion.items = [...(currentVersion.items ?? []), ...(page.items ?? [])]
      Object.assign(page, currentVersion)
      return updatePageAndProject(page, project, user._id)
     })
    res.status(201).json(newLine.asJSON(true))
  } catch (error) {
    // Handle version conflicts with optimistic locking
    if (error.status === 409) {
      return handleVersionConflict(res, error)
    }
    respondWithError(res, error.status ?? 500, error.message ?? 'Internal Server Error')
  }
})

// Update an existing line, including in RERUM
router.put('/:lineId', auth0Middleware(), screenContentMiddleware(), async (req, res) => {
  const user = req.user
  if (!user) return respondWithError(res, 401, "Unauthenticated request")
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
    page.columns.map(col => {
      col.lines = col.lines.map(lineId => lineId === oldLine.id ? updatedLine.id : lineId)
    })
    await withOptimisticLocking(
      () => updatePageAndProject(page, project, user._id, true),
      (currentVersion) => {
        if(!currentVersion || currentVersion.type !== 'AnnotationPage') {
          respondWithError(res, 409, 'Version conflict while updating the page. Please try again.')
        }
        const newLineIndex = currentVersion.items.findIndex(l => l.id.split('/').pop() === req.params.lineId?.split('/').pop())
        if (newLineIndex === -1) {
          respondWithError(res, 404, `Line with ID '${req.params.lineId}' not found in page '${req.params.pageId}'`)
          return
        }
        currentVersion.items[newLineIndex] = updatedLine
        Object.assign(page, currentVersion)
        return updatePageAndProject(page, project, user._id)
      }
    )
    res.json(line.asJSON(true))
  } catch (error) {
    // Handle version conflicts with optimistic locking
    if (error.status === 409) {
      return handleVersionConflict(res, error)
    }
    res.status(error.status ?? 500).json({ error: error.message })
  }
})

// Update the text of an existing line
router.patch('/:lineId/text', auth0Middleware(), screenContentMiddleware(), async (req, res) => {
  const user = req.user
  if (!user) return respondWithError(res, 401, "Unauthenticated request")
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
    const updatedLine = await line.updateText(req.body, {"creator": user._id})
    const lineIndex = page.items.findIndex(l => l.id.split('/').pop() === req.params.lineId?.split('/').pop())
    page.items[lineIndex] = updatedLine
    page.columns.map(col => {
      col.lines = col.lines.map(lineId => lineId === oldLine.id ? updatedLine.id : lineId)
    })
    await withOptimisticLocking(
      () => updatePageAndProject(page, project, user._id, true),
      (currentVersion) => {
        if(!currentVersion || currentVersion.type !== 'AnnotationPage') {
          if(res.headersSent) return
          respondWithError(res, 409, 'Version conflict while updating the page. Please try again.')
          return
        }
        const newLineIndex = currentVersion.items.findIndex(l => l.id.split('/').pop() === req.params.lineId?.split('/').pop())
        if (newLineIndex === -1) {
          if(res.headersSent) return
          respondWithError(res, 404, `Line with ID '${req.params.lineId}' not found in page '${req.params.pageId}'`)
          return
        }
        currentVersion.items[newLineIndex] = updatedLine
        Object.assign(page, currentVersion)
        return updatePageAndProject(page, project, user._id)
      }
    )
    if(res.headersSent) return
    res.json(line.asJSON(true))
  } catch (error) {
    // Handle version conflicts with optimistic locking
    if (error.status === 409) {
      handleVersionConflict(res, error)
      return
    }
    res.status(error.status ?? 500).json({ error: error.message })
  }
})

// Update the xywh (bounds) of an existing line
router.patch('/:lineId/bounds', auth0Middleware(), async (req, res) => {
  const user = req.user
  if (!user) return respondWithError(res, 401, "Unauthenticated request")
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
    page.columns.map(col => {
      col.lines = col.lines.map(lineId => lineId === oldLine.id ? updatedLine.id : lineId)
    })
    await withOptimisticLocking(
      () => updatePageAndProject(page, project, user._id, true),
      (currentVersion) => {
        if(!currentVersion || currentVersion.type !== 'AnnotationPage') {
          respondWithError(res, 409, 'Version conflict while updating the page. Please try again.')
          return
        }
        const newLineIndex = currentVersion.items.findIndex(l => l.id.split('/').pop() === req.params.lineId?.split('/').pop())
        if (newLineIndex === -1) {
          respondWithError(res, 404, `Line with ID '${req.params.lineId}' not found in page '${req.params.pageId}'`)
          return
        }
        currentVersion.items[newLineIndex] = updatedLine
        Object.assign(page, currentVersion)
        return updatePageAndProject(page, project, user._id)
      }
    )
    res.json(line.asJSON(true))
  } catch (error) {    // Handle version conflicts with optimistic locking
    if (error.status === 409) {
      return handleVersionConflict(res, error)
    }
    res.status(error.status ?? 500).json({ error: error.message })
  }
})

export default router
