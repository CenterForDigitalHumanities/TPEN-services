import express from 'express'
import auth0Middleware from '../auth/index.js'
import screenContentMiddleware from '../utilities/checkIfSuspicious.js'
import { hasSuspiciousPageData } from '../utilities/checkIfSuspicious.js'
import cors from 'cors'
import common_cors from '../utilities/common_cors.json' with {type: 'json'}
let router = express.Router({ mergeParams: true })
import Project from '../classes/Project/Project.js'
import Line from '../classes/Line/Line.js'
import Column from '../classes/Column/Column.js'
import { findPageById, respondWithError, getLayerContainingPage, updatePageAndProject, handleVersionConflict, getProjectById } from '../utilities/shared.js'
import { isSuspiciousValueString } from "../utilities/checkIfSuspicious.js"

router.use(
  cors(common_cors)
)

// This is a nested route for pages within a layer. It may be used 
// directly from /project/:projectId/page or with /layer/:layerId/page
// depending on the context of the request.
router.route('/:pageId')
  .get(async (req, res) => {
    const { projectId, pageId } = req.params
    try {
      const page = await findPageById(pageId, projectId, true)
      if (!page) {
        respondWithError(res, 404, 'No page found with that ID.')
        return
      }
      if (page.id?.startsWith(process.env.RERUMIDPREFIX)) {
        // If the page is a RERUM document, we need to fetch it from the server
        res.status(200).json(page)
        return
      }
      // build as AnnotationPage
      const pageAsAnnotationPage = {
        '@context': 'http://www.w3.org/ns/anno.jsonld',
        id: page.id,
        type: 'AnnotationPage',
        label: { none: [page.label] },
        target: page.target,
        partOf: [{
          id: page.partOf,
          type: "AnnotationCollection"
        }],
        items: page.items ?? [],
        prev: page.prev ?? null,
        next: page.next ?? null
      }
      res.status(200).json(pageAsAnnotationPage)
    } catch (error) {
      return respondWithError(res, error.status ?? 500, error.message ?? 'Internal Server Error')
    }
  })
  .put(auth0Middleware(), screenContentMiddleware(), async (req, res) => {
    const user = req.user
    if (!user) return respondWithError(res, 401, "Unauthenticated request")
    const { projectId, pageId } = req.params
    const update = req.body
    if (!update || typeof update !== 'object' || Object.keys(update).length === 0) {
      respondWithError(res, 400, 'No update data provided.')
      return
    }
    const project = await Project.getById(projectId)
    if (!project) {
      respondWithError(res, 404, `Project with ID '${projectId}' not found`)
      return
    }
    const layerId = getLayerContainingPage(project, pageId)?.id
    if (!layerId) {
      respondWithError(res, 404, `Layer containing page with ID '${pageId}' not found in project '${projectId}'`)
      return
    }

    try {
      if (hasSuspiciousPageData(req.body)) return respondWithError(res, 400, "Suspicious page data will not be processed.")
      // Find the page object
      const page = await findPageById(pageId, projectId)
      page.creator = user.agent.split('/').pop()
      page.partOf = layerId
      if (!page) {
        respondWithError(res, 404, 'No page found with that ID.')
        return
      }
      // Only update top-level properties that are present in the request
      Object.keys(update).forEach(key => {
        page[key] = update[key]
      })
      Object.keys(page).forEach(key => {
        if (page[key] === undefined || page[key] === null) {
          // Remove properties that are undefined or null.  prev and next can be null
          if (key !== "prev" && key !== "next") delete page[key]
          else page[key] = null
        }
      })
      if (update.items) {
        page.items = await Promise.all(page.items.map(async item => {
          const line = item.id?.startsWith?.('http')
            ? new Line(item)
            : Line.build(projectId, pageId, item, user.agent.split('/').pop())
          line.creator ??= user.agent.split('/').pop()
          return await line.update()
        }))
      }
      await updatePageAndProject(page, project, user._id)
      res.status(200).json(page)
    } catch (error) {
      // Handle version conflicts with optimistic locking
      if (error.status === 409) {
        if(res.headersSent) return
        return handleVersionConflict(res, error)
      }
      if(res.headersSent) return
      return respondWithError(res, error.status ?? 500, error.message ?? 'Internal Server Error')
    }
  })
  .all((req, res, next) => {
    respondWithError(res, 405, 'Improper request method, please use GET.')
  })

/**
 * Gets all annotation IDs that are not assigned to any column (excluding unordered column).
 *
 * @param {Object} page - The page object containing items and columns
 * @param {boolean} excludeUnordered - Whether to exclude the unordered column from calculation
 * @returns {string[]} Array of annotation IDs not in any column
 */
function getRemainingAnnotations(page, excludeUnordered = false) {
  const columnsToCheck = excludeUnordered
    ? page.columns.filter(col => col.label !== "Unordered Column")
    : page.columns
  const allColumnLines = columnsToCheck.flatMap(column => column.lines)
  return page.items.filter(item => !allColumnLines.includes(item.id)).map(item => item.id)
}

/**
 * Creates a new unordered column and adds it to the page.
 *
 * @param {string} projectId - The project ID
 * @param {string} pageId - The page ID
 * @param {Object} page - The page object from project data
 * @param {string[]} remainingAnnotations - Array of annotation IDs to add to the column
 * @param {boolean} unordered - Whether the column should be marked as unordered
 * @returns {Promise<void>}
 */
async function createUnorderedColumn(projectId, pageId, page, remainingAnnotations, unordered) {
  const unorderedColumnRecord = await Column.createNewColumn(
    pageId,
    projectId,
    "Unordered Column",
    remainingAnnotations,
    unordered
  )
  const unorderedColumn = {
    id: unorderedColumnRecord._id,
    label: "Unordered Column",
    lines: unorderedColumnRecord.lines
  }
  page.columns.push(unorderedColumn)
}

/**
 * Deletes the unordered column from both the database and the page object.
 *
 * @param {Object} page - The page object from project data
 * @returns {Promise<void>}
 */
async function deleteUnorderedColumn(page) {
  const unorderedColumn = page.columns.find(column => column.label === "Unordered Column")
  if (unorderedColumn) {
    const unorderedColumnDB = new Column(unorderedColumn.id)
    await unorderedColumnDB.delete()
    page.columns = page.columns.filter(column => column.label !== "Unordered Column")
  }
}

/**
 * Updates an existing unordered column with new annotation assignments.
 *
 * @param {Object} page - The page object from project data
 * @param {string[]} remainingAnnotations - Array of annotation IDs to assign to the column
 * @returns {Promise<void>}
 */
async function updateUnorderedColumn(page, remainingAnnotations) {
  const unorderedColumn = page.columns.find(column => column.label === "Unordered Column")
  if (unorderedColumn) {
    const unorderedColumnDB = new Column(unorderedColumn.id)
    const unorderedColumnData = await unorderedColumnDB.getColumnData()
    unorderedColumnData.lines = remainingAnnotations
    unorderedColumnDB.data = unorderedColumnData
    unorderedColumn.lines = remainingAnnotations
    await unorderedColumnDB.update()
  }
}

/**
 * Checks and creates or updates an unordered column for annotations not assigned to any column.
 * This function ensures all page annotations are organized in columns by creating/updating an "Unordered Column"
 * for any remaining annotations not assigned to other columns.
 *
 * @param {string} projectId - The project ID
 * @param {string} pageId - The page ID
 * @param {Object} project - The Project instance for database updates
 * @param {Object} page - The page object from project data
 * @param {Object} pageRerum - The full page annotation from RERUM
 * @param {Object} projectRerum - The full project object from RERUM
 * @param {Object} user - The user object
 * @param {Object} res - Express response object
 * @param {boolean} unordered - Whether the column should be marked as unordered
 * @returns {Promise<void>}
 */
async function checkAndCreateUnorderedColumn(projectId, pageId, project, page, pageRerum, projectRerum, user, unordered) {
  const hasUnorderedColumn = page.columns.some(column => column.label === "Unordered Column")
  const allColumnLines = page.columns ? page.columns.flatMap(column => column.label !== "Unordered Column" ? column.lines : []) : []
  const remainingAnnotations = getRemainingAnnotations(page, true)

  // If there are no columns at all, remove the columns property
  if (allColumnLines.length === 0) {
    delete page.columns
    await updatePageAndProject(pageRerum, project, user._id)
    await projectRerum.update()
    return
  }

  // If no unordered column exists yet
  if (!hasUnorderedColumn) {
    if (remainingAnnotations.length === 0) {
      await updatePageAndProject(pageRerum, project, user._id)
      await projectRerum.update()
      return
    }
    await createUnorderedColumn(projectId, pageId, page, remainingAnnotations, unordered)
    return
  }
  // Unordered column exists - update or delete it
  if (remainingAnnotations.length === 0) {
    await deleteUnorderedColumn(page)
    await updatePageAndProject(pageRerum, project, user._id)
    await projectRerum.update()
    return
  }
  await updateUnorderedColumn(page, remainingAnnotations)
}

/**
 * Updates the prev and next pointers of the newly created column and the previous last column.
 *
 * @param {Object} page - The page object containing columns
 * @param {Object} newColumnRecord - The newly created column record
 * @returns {Promise<void>}
 */
async function updatePrevAndNextColumns(page, newColumnRecord) {
  const previousColumn = page.columns ? page.columns[page.columns.length - 3] : null
  if (previousColumn) {
    const previousColumnDB = new Column(previousColumn.id)
    const previousColumnData = await previousColumnDB.getColumnData()
    previousColumnData.next = newColumnRecord._id
    previousColumnDB.data = previousColumnData
    await previousColumnDB.update()
    
    const currentColumnDB = new Column(newColumnRecord._id)
    const currentColumnData = await currentColumnDB.getColumnData()
    currentColumnData.prev = previousColumn.id
    currentColumnDB.data = currentColumnData
    await currentColumnDB.update()
    return
  }
  
  const currentColumnDB = new Column(newColumnRecord._id)
  const currentColumnData = await currentColumnDB.getColumnData()
  currentColumnData.prev = null
  currentColumnData.next = null
  currentColumnDB.data = currentColumnData
  await currentColumnDB.update()
}

router.route('/:pageId/column')
  .post(auth0Middleware(), async (req, res) => {
    const { projectId, pageId } = req.params
    const { label, annotations, unordered = false } = req.body
    if (!label || !Array.isArray(annotations)) {
      return respondWithError(res, 400, 'Invalid column data provided.')
    }
    if(isSuspiciousValueString(label)) {
      return respondWithError(res, 400, "Suspicious column label will not be processed.")
    }
    const user = req.user
    if (!user) return respondWithError(res, 401, "Unauthenticated request")
    try {
      const project = await Project.getById(projectId)
      if (!project) return
      const pageRerum = await findPageById(pageId, projectId)
      if (!pageRerum) return
      const projectRerum = await getProjectById(projectId)
      if (!projectRerum) return
      const page = projectRerum.data.layers.map(layer => layer.pages.find(p => p.id.split('/').pop() === pageId)).find(p => p)
      if (!page) return

      const allColumnLines = page.columns ? page.columns.flatMap(column => column.label !== "Unordered Column" ? column.lines : []) : []
      const duplicateAnnotations = annotations.filter(annId => allColumnLines.includes(annId))
      if (duplicateAnnotations.length > 0) {
        return respondWithError(res, 400, `The following annotations are already assigned to other columns: ${duplicateAnnotations.join(', ')}`)
      }

      const existingLabels = page.columns ? page.columns.map(column => column.label) : []
      if (existingLabels.includes(label)) {
        return respondWithError(res, 400, `A column with the label '${label}' already exists.`)
      }

      const newColumnRecord = await Column.createNewColumn(pageId, projectId, label, annotations, unordered)
      const columns = {
        id: newColumnRecord._id,
        label: newColumnRecord.label,
        lines: newColumnRecord.lines
      }
    
      page.columns = [...(page.columns || []), columns]

      const allLineIds = page.columns.flatMap(col => col.lines)
      pageRerum.items.sort((a, b) => {
        let indexA = allLineIds.indexOf(a.id)
        let indexB = allLineIds.indexOf(b.id)
        if (indexA === -1) indexA = Infinity
        if (indexB === -1) indexB = Infinity
        return indexA - indexB
      })
      page.items = pageRerum.items

      await checkAndCreateUnorderedColumn(projectId, pageId, project, page, pageRerum, projectRerum, user, unordered)
      const unorderedColumn = page.columns.find(column => column.label === "Unordered Column")
      page.columns = page.columns.filter(column => column.label !== "Unordered Column")
      if (unorderedColumn) {
        page.columns.push(unorderedColumn)
      }
      await updatePrevAndNextColumns(page, newColumnRecord)
      await updatePageAndProject(pageRerum, project, user._id)
      await projectRerum.update()
      res.status(201).json(newColumnRecord)
    } catch (error) {
      return respondWithError(res, error.status ?? 500, error.message ?? 'Internal Server Error')
    }
  })
  .put(auth0Middleware(), async (req, res) => {
    const { projectId, pageId } = req.params
    const { newLabel, columnLabelsToMerge } = req.body
    if (!newLabel || !Array.isArray(columnLabelsToMerge) || columnLabelsToMerge.length < 2) {
      return respondWithError(res, 400, 'Invalid column merge data provided.')
    }
    if(isSuspiciousValueString(newLabel)) {
      return respondWithError(res, 400, "Suspicious column label will not be processed.")
    }
    const user = req.user
    if (!user) return respondWithError(res, 401, "Unauthenticated request")
    try {
      const project = await Project.getById(projectId)
      if (!project) return
      const pageRerum = await findPageById(pageId, projectId)
      if (!pageRerum) return
      const projectRerum = await getProjectById(projectId)
      if (!projectRerum) return
      const page = projectRerum.data.layers.map(layer => layer.pages.find(p => p.id.split('/').pop() === pageId)).find(p => p)
      if (!page) return

      const columnsToMerge = page.columns.filter(column => columnLabelsToMerge.includes(column.label))
      if (columnsToMerge.length !== columnLabelsToMerge.length) {
        return respondWithError(res, 404, 'One or more columns to merge not found.')
      }

      const uniqueLabels = new Set(page.columns.map(column => column.label).filter(label => !columnLabelsToMerge.includes(label)))
      if (uniqueLabels.has(newLabel)) {
        return respondWithError(res, 400, `A column with the label '${newLabel}' already exists.`)
      }

      const mergedLines = columnsToMerge.flatMap(column => column.lines)
      const allColumnLines = page.columns ? page.columns.flatMap(column => !columnLabelsToMerge.includes(column.label) && column.label !== "Unordered Column" ? column.lines : []) : []
      const duplicateAnnotations = mergedLines.filter(annId => allColumnLines.includes(annId))
      if (duplicateAnnotations.length > 0) {
        return respondWithError(res, 400, `The following annotations are already assigned to other columns: ${duplicateAnnotations.join(', ')}`)
      }
      const mergedColumnRecord = await Column.createNewColumn(pageId, projectId, newLabel, mergedLines, false)
      const mergedColumn = {
        id: mergedColumnRecord._id,
        label: mergedColumnRecord.label,
        lines: mergedColumnRecord.lines
      }

      for (const label of columnLabelsToMerge) {
        const columnToDelete = page.columns.find(column => column.label === label)
        if (columnToDelete) {
          const columnDB = new Column(columnToDelete.id)
          await columnDB.delete()
        }
      }

      page.columns = page.columns.filter(column => !columnLabelsToMerge.includes(column.label))
      page.columns.push(mergedColumn)

      const allLineIds = page.columns.flatMap(col => col.lines)
      pageRerum.items.sort((a, b) => {
        let indexA = allLineIds.indexOf(a.id)
        let indexB = allLineIds.indexOf(b.id)
        if (indexA === -1) indexA = Infinity
        if (indexB === -1) indexB = Infinity
        return indexA - indexB
      })
      page.items = pageRerum.items

      await checkAndCreateUnorderedColumn(projectId, pageId, project, page, pageRerum, projectRerum, user, false)
      const unorderedColumn = page.columns.find(column => column.label === "Unordered Column")
      page.columns = page.columns.filter(column => column.label !== "Unordered Column")
      if (unorderedColumn) {
        page.columns.push(unorderedColumn)
      }
      await updatePrevAndNextColumns(page, mergedColumnRecord)
      await updatePageAndProject(pageRerum, project, user._id)
      await projectRerum.update()
      res.status(200).json(mergedColumnRecord)
    } catch (error) {
      return respondWithError(res, error.status ?? 500, error.message ?? 'Internal Server Error')
    }
  })
  .patch(auth0Middleware(), async (req, res) => {
    const { projectId, pageId } = req.params
    const { columnLabel, annotationIdsToAdd } = req.body
    if (!columnLabel || !Array.isArray(annotationIdsToAdd) || annotationIdsToAdd.length === 0) {
      return respondWithError(res, 400, 'Invalid column update data provided.')
    }
    if(isSuspiciousValueString(columnLabel)) {
      return respondWithError(res, 400, "Suspicious column label will not be processed.")
    }
    const user = req.user
    if (!user) return respondWithError(res, 401, "Unauthenticated request")
    try {
      const project = await Project.getById(projectId)
      if (!project) return
      const pageRerum = await findPageById(pageId, projectId)
      if (!pageRerum) return
      const projectRerum = await getProjectById(projectId)
      if (!projectRerum) return
      const page = projectRerum.data.layers.map(layer => layer.pages.find(p => p.id.split('/').pop() === pageId)).find(p => p)
      if (!page) return

      const columnToUpdate = page.columns.find(column => column.label === columnLabel)
      if (!columnToUpdate) {
        return respondWithError(res, 404, 'Column to update not found.')
      }

      const allColumnLines = page.columns ? page.columns.flatMap(column => column.label !== "Unordered Column" ? column.lines : []) : []
      const duplicateAnnotations = annotationIdsToAdd.filter(annId => allColumnLines.includes(annId))
      if (duplicateAnnotations.length > 0) {
        return respondWithError(res, 400, `The following annotations are already assigned to other columns: ${duplicateAnnotations.join(', ')}`)
      }

      const columnDB = new Column(columnToUpdate.id)
      const columnData = await columnDB.getColumnData()
      const newLines = Array.from(new Set([...columnData.lines, ...annotationIdsToAdd]))
      columnData.lines = newLines
      columnDB.data = columnData
      await columnDB.update()

      columnToUpdate.lines = newLines

      const allLineIds = page.columns.flatMap(col => col.lines)
      pageRerum.items.sort((a, b) => {
        let indexA = allLineIds.indexOf(a.id)
        let indexB = allLineIds.indexOf(b.id)
        if (indexA === -1) indexA = Infinity
        if (indexB === -1) indexB = Infinity
        return indexA - indexB
      })
      page.items = pageRerum.items

      await checkAndCreateUnorderedColumn(projectId, pageId, project, page, pageRerum, projectRerum, user, false)
      await updatePageAndProject(pageRerum, project, user._id)
      await projectRerum.update()
      res.status(200).json({ message: "Column updated successfully." })
    } catch (error) {
      return respondWithError(res, error.status ?? 500, error.message ?? 'Internal Server Error')
    }
  })
  .all((req, res, next) => {
    respondWithError(res, 405, 'Improper request method, please use POST.')
  })

router.route('/:pageId/unordered-column')
  .post(auth0Middleware(), async (req, res) => {
    const { projectId, pageId } = req.params
    const { label, annotations, unordered = true } = req.body
    if (!label || !Array.isArray(annotations)) {
      return respondWithError(res, 400, 'Invalid column data provided.')
    }
    if(isSuspiciousValueString(label)) {
      return respondWithError(res, 400, "Suspicious column label will not be processed.")
    }
    const user = req.user
    if (!user) return respondWithError(res, 401, "Unauthenticated request")
    try {
      const project = await Project.getById(projectId)
      if (!project) return
      const pageRerum = await findPageById(pageId, projectId)
      if (!pageRerum) return
      const projectRerum = await getProjectById(projectId)
      if (!projectRerum) return
      const page = projectRerum.data.layers.map(layer => layer.pages.find(p => p.id.split('/').pop() === pageId)).find(p => p)
      if (!page) return

      const allColumnLines = page.columns ? page.columns.flatMap(column => column.label !== "Unordered Column" ? column.lines : []) : []
      const duplicateAnnotations = annotations.filter(annId => allColumnLines.includes(annId))
      if (duplicateAnnotations.length > 0) {
        return respondWithError(res, 400, `The following annotations are already assigned to other columns: ${duplicateAnnotations.join(', ')}`)
      }

      if (!page.columns) page.columns = []

      await checkAndCreateUnorderedColumn(projectId, pageId, project, page, pageRerum, projectRerum, user, unordered)
      await updatePageAndProject(pageRerum, project, user._id)
      await projectRerum.update()
      res.status(201).json({ message: "Unordered column updated/created successfully." })   
    } catch (error) {
      return respondWithError(res, error.status ?? 500, error.message ?? 'Internal Server Error')
    }
  })
  .all((req, res, next) => {
    respondWithError(res, 405, 'Improper request method, please use POST.')
  })

router.route('/:pageId/clear-columns')
  .delete(auth0Middleware(), async (req, res) => {
    const { projectId, pageId } = req.params
    const user = req.user
    if (!user) return respondWithError(res, 401, "Unauthenticated request")
    try {
      const project = await Project.getById(projectId)
      if (!project) return
      const pageRerum = await findPageById(pageId, projectId)
      if (!pageRerum) return
      const projectRerum = await getProjectById(projectId)
      if (!projectRerum) return

      const page = projectRerum.data.layers.map(layer => layer.pages.find(p => p.id.split('/').pop() === pageId)).find(p => p)
      if (!page) return

      const columnIds = page.columns.map(column => column.id)
      for(const columnId of columnIds) {
        const columnDB = new Column(columnId)
        await columnDB.delete()
      }
      delete page.columns
      await updatePageAndProject(pageRerum, project, user._id)
      await projectRerum.update()
      res.status(204).send()
    } catch (error) {
      return respondWithError(res, error.status ?? 500, error.message ?? 'Internal Server Error')
    }
  })
  .all((req, res, next) => {
    respondWithError(res, 405, 'Improper request method, please use DELETE.')
  })
// router.use('/:pageId/line', lineRouter)

export default router
