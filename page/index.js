import express from 'express'
import auth0Middleware from '../auth/index.js'
import screenContentMiddleware from '../utilities/checkIfSuspicious.js'
import { hasSuspiciousPageData } from '../utilities/checkIfSuspicious.js'
import cors from 'cors'
import common_cors from '../utilities/common_cors.json' with {type: 'json'}
let router = express.Router({ mergeParams: true })
import Project from '../classes/Project/Project.js'
import Line from '../classes/Line/Line.js'
import { findPageById, respondWithError, getLayerContainingPage, updatePageAndProject, handleVersionConflict, resolveURI } from '../utilities/shared.js'

router.use(
  cors(common_cors)
)

// This is a nested route for pages within a layer. It may be used 
// directly from /project/:projectId/page or with /layer/:layerId/page
// depending on the context of the request.
router.route('/:pageId')
  .get(async (req, res) => {
    const { projectId, pageId } = req.params
    const fullyResolved = req.query.fullyResolved === 'true'
    
    try {
      const page = await findPageById(pageId, projectId, true)
      if (!page) {
        respondWithError(res, 404, 'No page found with that ID.')
        return
      }
      if (page.id?.startsWith(process.env.RERUMIDPREFIX)) {
        // If the page is a RERUM document, we need to fetch it from the server
        // Build as AnnotationPage even for RERUM documents
        const pageAsAnnotationPage = {
          '@context': 'http://www.w3.org/ns/anno.jsonld',
          id: page.id,
          type: 'AnnotationPage',
          label: page.label ?? { none: [page.label] },
          target: page.target,
          partOf: page.partOf ?? [{
            id: page.partOf,
            type: "AnnotationCollection"
          }],
          items: page.items ?? [],
          prev: page.prev ?? null,
          next: page.next ?? null
        }
        
        // If fullyResolved is requested, resolve all references
        if (fullyResolved) {
          try {
            // Resolve items (Annotations)
            if (Array.isArray(pageAsAnnotationPage.items) && pageAsAnnotationPage.items.length > 0) {
              const resolvedItems = await Promise.all(
                pageAsAnnotationPage.items.map(async (item) => {
                  // If item is just a reference (string or object with only id), resolve it
                  if (typeof item === 'string') {
                    const resolved = await resolveURI(item)
                    return resolved || { id: item, type: 'Annotation' }
                  } else if (item.id && !item.body) {
                    // Item has id but no body, try to resolve it
                    const resolved = await resolveURI(item.id)
                    return resolved || item
                  }
                  // Item is already fully resolved
                  return item
                })
              )
              pageAsAnnotationPage.items = resolvedItems
            }
            
            // Resolve partOf (AnnotationCollection)
            if (Array.isArray(pageAsAnnotationPage.partOf) && pageAsAnnotationPage.partOf.length > 0) {
              const resolvedPartOf = await Promise.all(
                pageAsAnnotationPage.partOf.map(async (collection) => {
                  if (typeof collection === 'string') {
                    const resolved = await resolveURI(collection)
                    return resolved || { id: collection, type: 'AnnotationCollection' }
                  } else if (collection.id && !collection.label) {
                    // Collection has id but minimal properties, try to resolve it
                    const resolved = await resolveURI(collection.id)
                    return resolved || collection
                  }
                  return collection
                })
              )
              pageAsAnnotationPage.partOf = resolvedPartOf
            }
          } catch (resolveError) {
            console.error('Error resolving references:', resolveError)
            // Continue with partially resolved data rather than failing completely
          }
        }
        
        res.status(200).json(pageAsAnnotationPage)
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
      
      // If fullyResolved is requested, resolve all references
      if (fullyResolved) {
        try {
          // Resolve items (Annotations)
          if (Array.isArray(pageAsAnnotationPage.items) && pageAsAnnotationPage.items.length > 0) {
            const resolvedItems = await Promise.all(
              pageAsAnnotationPage.items.map(async (item) => {
                // If item is just a reference (string or object with only id), resolve it
                if (typeof item === 'string') {
                  const resolved = await resolveURI(item)
                  return resolved || { id: item, type: 'Annotation' }
                } else if (item.id && !item.body) {
                  // Item has id but no body, try to resolve it
                  const resolved = await resolveURI(item.id)
                  return resolved || item
                }
                // Item is already fully resolved
                return item
              })
            )
            pageAsAnnotationPage.items = resolvedItems
          }
          
          // Resolve partOf (AnnotationCollection)
          if (Array.isArray(pageAsAnnotationPage.partOf) && pageAsAnnotationPage.partOf.length > 0) {
            const resolvedPartOf = await Promise.all(
              pageAsAnnotationPage.partOf.map(async (collection) => {
                if (typeof collection === 'string') {
                  const resolved = await resolveURI(collection)
                  return resolved || { id: collection, type: 'AnnotationCollection' }
                } else if (collection.id && !collection.label) {
                  // Collection has id but minimal properties, try to resolve it
                  const resolved = await resolveURI(collection.id)
                  return resolved || collection
                }
                return collection
              })
            )
            pageAsAnnotationPage.partOf = resolvedPartOf
          }
        } catch (resolveError) {
          console.error('Error resolving references:', resolveError)
          // Continue with partially resolved data rather than failing completely
        }
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

// router.use('/:pageId/line', lineRouter)

export default router
