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
import { findPageById, respondWithError, getLayerContainingPage, updatePageAndProject, handleVersionConflict, resolveReferences } from '../utilities/shared.js'
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

      let pageColumnsUpdate = null
      let pageInProject = project.data.layers.map(layer => layer.pages.find(p => p.id.split('/').pop() === pageId)).find(p => p)
      let pageItemIds = page.items ? page.items.map(item => item.id) : []
      if (update.items) {
        const updateItemIds = update.items.map(item => item.id)
        const deletedIds = pageItemIds.filter(id => !updateItemIds.includes(id))
        if (deletedIds.length > 0 && pageInProject.columns && pageInProject.columns.length > 0) {
          for (const column of pageInProject.columns) {
            const columnDB = new Column(column.id)
            const columnData = await columnDB.getColumnData()
            const newLines = columnData.lines.filter(lineId => !deletedIds.includes(lineId))
            if (newLines.length !== columnData.lines.length) {
              columnData.lines = newLines
              columnDB.data = columnData
              if (newLines.length === 0) {
                await columnDB.delete()
                pageInProject.columns = pageInProject.columns.filter(col => col.id !== column.id)
                await updatePrevAndNextColumns(pageInProject)
              } else {
                await columnDB.update()
                column.lines = newLines
              }
            }
          }
          pageColumnsUpdate = pageInProject.columns.map(column => {
            const newLines = column.lines.filter(lineId => !deletedIds.includes(lineId))
            return { ...column, lines: newLines }
          })
        }
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
          const updatedLine = await line.update()
          console.log(item.id, updatedLine.id)

          if (pageItemIds.includes(item.id)) {
            console.log('I was here from the start')
            for (const column of pageInProject.columns) {
              if (column.lines.includes(item.id)) {
                const columnDB = new Column(column.id)
                const columnData = await columnDB.getColumnData()
                const lineIndex = columnData.lines.indexOf(item.id)
                if (lineIndex !== -1) {
                  columnData.lines[lineIndex] = updatedLine.id
                  columnDB.data = columnData
                  await columnDB.update()
                }
              }
              if (pageColumnsUpdate) {
                pageColumnsUpdate = pageColumnsUpdate.map(col => {
                  if (col.lines.includes(item.id)) {
                    const newLines = col.lines.map(lineId => lineId === item.id ? updatedLine.id : lineId)
                    return { ...col, lines: newLines }
                  }
                  return col
                })
              } else {
                pageColumnsUpdate = project.data.layers.map(layer => layer.pages.find(p => p.id.split('/').pop() === pageId)).find(p => p).columns.map(col => {
                  if (col.lines.includes(item.id)) {
                    const newLines = col.lines.map(lineId => lineId === item.id ? updatedLine.id : lineId)
                    return { ...col, lines: newLines }
                  }
                  return col
                })
              }
            }
          }
          if (!item.id.includes(process.env.RERUMIDPREFIX)) {
            console.log('New Column')
            console.log(pageColumnsUpdate ? pageColumnsUpdate.length : 'no pageColumnsUpdate')
            const newColumn = await Column.createNewColumn(pageId, projectId, `Column ${pageColumnsUpdate ? pageColumnsUpdate.length + 1 : 1}`, [updatedLine.id])            
            const columnToAdd = {
              id: newColumn._id,
              label: newColumn.label,
              lines: newColumn.lines
            }
            console.log(newColumn, columnToAdd)
            pageInProject.columns = [...(pageInProject.columns || []), columnToAdd]
            if (pageColumnsUpdate) {
              pageColumnsUpdate.push(columnToAdd)
            } else {
              pageColumnsUpdate = project.data.layers.map(layer => layer.pages.find(p => p.id.split('/').pop() === pageId)).find(p => p).columns
            }
            await updatePrevAndNextColumns(pageInProject)
            pageItemIds.push(updatedLine.id)
          }
          return updatedLine
        }))
      }
      await updatePageAndProject(page, project, user._id)
      if (pageColumnsUpdate) {
        const pageInProject = project.data.layers.map(layer => layer.pages.find(p => p.id.split('/').pop() === pageId)).find(p => p)
        pageInProject.columns = pageColumnsUpdate
        await project.update()
      }
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
    respondWithError(res, 405, 'Improper request method. Supported: GET, PUT.')
  })

  /**
   * Updates the prev and next pointers for all columns in the given page.
   *
   * @param {Object} page - The page object containing columns
   * @returns {Promise<void>}
   */
  async function updatePrevAndNextColumns(page) {
    if (!page.columns || page.columns.length === 0) return
    const allColumnIds = page.columns.map(column => column.id)
    for (let i = 0; i < page.columns.length; i++) {
      const column = page.columns[i]
      const columnDB = new Column(column.id)
      const columnData = await columnDB.getColumnData()
      columnData.prev = i > 0 ? allColumnIds[i - 1] : null
      columnData.next = i < page.columns.length - 1 ? allColumnIds[i + 1] : null
      columnDB.data = columnData
      await columnDB.update()
    }
  }

router.route('/:pageId/column')
  .post(auth0Middleware(), async (req, res) => {
    const user = req.user
    if (!user) return respondWithError(res, 401, "Unauthenticated request")
    
    const { projectId, pageId } = req.params
    if (!projectId) return respondWithError(res, 400, "Project ID is required")
    if (!pageId) return respondWithError(res, 400, "Page ID is required")
    
    const { label, annotations } = req.body
    if (typeof label !== 'string' || !label?.trim() || !Array.isArray(annotations)) {
      return respondWithError(res, 400, 'Invalid column data provided.')
    }
    if (annotations.length === 0) {
      return respondWithError(res, 400, 'Columns must contain at least one annotation.')
    }
    if (isSuspiciousValueString(label)) {
      return respondWithError(res, 400, "Suspicious column label will not be processed.")
    }
    try {
      const project = await Project.getById(projectId)
      if (!project?.data) return respondWithError(res, 404, "Project not found")
      
      const page = project.data.layers.map(layer => layer.pages.find(p => p.id.split('/').pop() === pageId)).find(p => p)
      if (!page) return respondWithError(res, 404, "Page not found in project")

      const pageItemIds = page.items?.map(item => item.id) || []
      const invalidAnnotations = annotations.filter(id => !pageItemIds.includes(id))
      if (invalidAnnotations.length > 0) {
        return respondWithError(res, 400, `The following annotations do not exist on this page: ${invalidAnnotations.join(', ')}`)
      }

      const existingLabels = page.columns ? page.columns.map(column => column.label) : []
      if (existingLabels.includes(label)) {
        return respondWithError(res, 400, `A column with the label '${label}' already exists.`)
      }

      if (page.columns && page.columns.length > 0) {
        for (const column of page.columns) {
          const overlappingAnnotations = column.lines.filter(annId => annotations.includes(annId))
          if (column.lines.length === overlappingAnnotations.length) {  
            const columnDB = new Column(column.id)
            await columnDB.delete()
            page.columns = page.columns.filter(col => col.id !== column.id)
            continue
          }
          if (overlappingAnnotations.length > 0) {
            const columnDB = new Column(column.id)
            const columnData = await columnDB.getColumnData()
            columnData.lines = columnData.lines.filter(annId => !annotations.includes(annId))
            columnDB.data = columnData
            await columnDB.update()
            column.lines = column.lines.filter(annId => !annotations.includes(annId))
          }
        }
      }

      const newColumnRecord = await Column.createNewColumn(pageId, projectId, label, annotations)
      const newColumn = {
        id: newColumnRecord._id,
        label: newColumnRecord.label,
        lines: newColumnRecord.lines
      }
    
      page.columns = [...(page.columns || []), newColumn]

      await updatePrevAndNextColumns(page)
      await project.update()
      res.status(201).json(newColumnRecord)
    } catch (error) {
      return respondWithError(res, error.status ?? 500, error.message ?? 'Internal Server Error')
    }
  })
  .put(auth0Middleware(), async (req, res) => {
    const user = req.user
    if (!user) return respondWithError(res, 401, "Unauthenticated request")
    
    const { projectId, pageId } = req.params
    if (!projectId) return respondWithError(res, 400, "Project ID is required")
    if (!pageId) return respondWithError(res, 400, "Page ID is required")
    
    const { newLabel, columnLabelsToMerge } = req.body
    if (typeof newLabel !== 'string' || !newLabel?.trim() || !Array.isArray(columnLabelsToMerge) || columnLabelsToMerge.length < 2) {
      return respondWithError(res, 400, 'Invalid column merge data provided.')
    }
    if (isSuspiciousValueString(newLabel)) {
      return respondWithError(res, 400, "Suspicious column label will not be processed.")
    }
    try {
      const project = await Project.getById(projectId)
      if (!project?.data) return respondWithError(res, 404, "Project not found")
      
      const page = project.data.layers.map(layer => layer.pages.find(p => p.id.split('/').pop() === pageId)).find(p => p)
      if (!page) return respondWithError(res, 404, "Page not found in project")

      if (!page.columns || page.columns.length === 0) {
        return respondWithError(res, 404, "No columns exist on this page")
      }

      const columnsToMerge = page.columns.filter(column => columnLabelsToMerge.includes(column.label))
      if (columnsToMerge.length !== columnLabelsToMerge.length) {
        return respondWithError(res, 404, 'One or more columns to merge not found.')
      }

      const uniqueLabels = new Set(page.columns.map(column => column.label).filter(label => !columnLabelsToMerge.includes(label)))
      if (uniqueLabels.has(newLabel)) {
        return respondWithError(res, 400, `A column with the label '${newLabel}' already exists.`)
      }

      const mergedLines = columnsToMerge.flatMap(column => column.lines)
      const allColumnLines = page.columns ? page.columns.flatMap(column => !columnLabelsToMerge.includes(column.label) ? column.lines : []) : []
      const duplicateAnnotations = mergedLines.filter(annId => allColumnLines.includes(annId))
      if (duplicateAnnotations.length > 0) {
        return respondWithError(res, 400, `The following annotations are already assigned to other columns: ${duplicateAnnotations.join(', ')}`)
      }
      const mergedColumnRecord = await Column.createNewColumn(pageId, projectId, newLabel, mergedLines)
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

      await updatePrevAndNextColumns(page)
      await project.update()
      res.status(200).json(mergedColumnRecord)
    } catch (error) {
      return respondWithError(res, error.status ?? 500, error.message ?? 'Internal Server Error')
    }
  })
  .patch(auth0Middleware(), async (req, res) => {
    const user = req.user
    if (!user) return respondWithError(res, 401, "Unauthenticated request")
    
    const { projectId, pageId } = req.params
    if (!projectId) return respondWithError(res, 400, "Project ID is required")
    if (!pageId) return respondWithError(res, 400, "Page ID is required")
    
    const { columnLabel, annotationIdsToAdd } = req.body
    if (typeof columnLabel !== 'string' || !columnLabel?.trim() || !Array.isArray(annotationIdsToAdd) || annotationIdsToAdd.length === 0) {
      return respondWithError(res, 400, 'Invalid column update data provided.')
    }
    if(isSuspiciousValueString(columnLabel)) {
      return respondWithError(res, 400, "Suspicious column label will not be processed.")
    }
    try {
      const project = await Project.getById(projectId)
      if (!project?.data) return respondWithError(res, 404, "Project not found")
      
      const page = project.data.layers.map(layer => layer.pages.find(p => p.id.split('/').pop() === pageId)).find(p => p)
      if (!page) return respondWithError(res, 404, "Page not found in project")

      if (!page.columns || page.columns.length === 0) {
        return respondWithError(res, 404, "No columns exist on this page")
      }

      const columnToUpdate = page.columns.find(column => column.label === columnLabel)
      if (!columnToUpdate) {
        return respondWithError(res, 404, 'Column to update not found.')
      }

      const pageItemIds = page.items?.map(item => item.id) || []
      const invalidAnnotations = annotationIdsToAdd.filter(id => !pageItemIds.includes(id))
      if (invalidAnnotations.length > 0) {
        return respondWithError(res, 400, `The following annotations do not exist on this page: ${invalidAnnotations.join(', ')}`)
      }

      const allColumnLines = page.columns ? page.columns.flatMap(column => column.lines) : []
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

      await project.update()
      res.status(200).json({ message: "Column updated successfully." })
    } catch (error) {
      return respondWithError(res, error.status ?? 500, error.message ?? 'Internal Server Error')
    }
  })
  .all((req, res, next) => {
    respondWithError(res, 405, 'Improper request method. Supported: POST, PUT, PATCH.')
  })

router.route('/:pageId/clear-columns')
  .delete(auth0Middleware(), async (req, res) => {
    const user = req.user
    if (!user) return respondWithError(res, 401, "Unauthenticated request")
    
    const { projectId, pageId } = req.params
    if (!projectId) return respondWithError(res, 400, "Project ID is required")
    if (!pageId) return respondWithError(res, 400, "Page ID is required")
    try {
      const project = await Project.getById(projectId)
      if (!project?.data) return respondWithError(res, 404, "Project not found")
      
      const page = project.data.layers.map(layer => layer.pages.find(p => p.id.split('/').pop() === pageId)).find(p => p)
      if (!page) return respondWithError(res, 404, "Page not found in project")

      if (!page.columns || page.columns.length === 0) {
        return res.status(204).send()
      }

      const columnIds = page.columns.map(column => column.id)
      for(const columnId of columnIds) {
        const columnDB = new Column(columnId)
        await columnDB.delete()
      }
      delete page.columns

      await project.update()
      res.status(204).send()
    } catch (error) {
      return respondWithError(res, error.status ?? 500, error.message ?? 'Internal Server Error')
    }
  })
  .all((req, res, next) => {
    respondWithError(res, 405, 'Improper request method, please use DELETE.')
  })
  
// Fully resolved page endpoint - returns page with fully populated annotation data
router.route('/:pageId/resolved')
  .get(async (req, res) => {
    const { projectId, pageId } = req.params
    try {
      const page = await findPageById(pageId, projectId, true)
      if (!page) {
        respondWithError(res, 404, 'No page found with that ID.')
        return
      }
      if (page.id?.startsWith(process.env.RERUMIDPREFIX)) {
        // RERUM pages already have fully resolved items
        res.status(200).json(page)
        return
      }
      // Resolve all annotation references in the items array
      let resolvedPage = page
      if (page.items && page.items.length > 0) {
        // Resolve all annotations in the items array
        const resolvedItems = await resolveReferences(page.items)
        resolvedPage = { ...page, items: resolvedItems }
      }
      res.status(200).json(resolvedPage)
    } catch (error) {
      return respondWithError(res, error.status ?? 500, error.message ?? 'Internal Server Error')
    }
  })
  .all((req, res) => {
    respondWithError(res, 405, 'Improper request method, please use GET.')
  })
  // router.use('/:pageId/line', lineRouter)
export default router
