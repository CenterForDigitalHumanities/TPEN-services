import express from 'express'
import auth0Middleware from '../auth/index.js'
import screenContentMiddleware from '../utilities/checkIfSuspicious.js'
import { hasSuspiciousPageData } from '../utilities/checkIfSuspicious.js'
import cors from 'cors'
import common_cors from '../utilities/common_cors.json' with {type: 'json'}
let router = express.Router({ mergeParams: true })
import Project from '../classes/Project/Project.js'
import Line from '../classes/Line/Line.js'
import { findPageById, respondWithError, getLayerContainingPage, updatePageAndProject, handleVersionConflict } from '../utilities/shared.js'

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
        // If the page is a RERUM document, check if resolution is requested
        const shouldResolve = req.query.resolve === 'full'

        if (shouldResolve) {
          // Resolve items array: fetch full annotation objects
          if (page.items?.length > 0) {
            page.items = await Promise.all(
              page.items.map(async item => {
                // Only resolve if item has an HTTP URI
                if (item?.id?.startsWith('http')) {
                  try {
                    // Create a fetch with 10 second timeout
                    const controller = new AbortController()
                    const timeoutId = setTimeout(() => controller.abort(), 10000)

                    const response = await fetch(item.id, { signal: controller.signal })
                    clearTimeout(timeoutId)

                    if (response.ok) {
                      return await response.json()
                    } else {
                      console.warn(`Failed to resolve annotation ${item.id}: HTTP ${response.status}`)
                    }
                  } catch (err) {
                    if (err.name === 'AbortError') {
                      console.warn(`Timeout resolving annotation ${item.id}`)
                    } else {
                      console.warn(`Error resolving annotation ${item.id}:`, err.message)
                    }
                  }
                }
                // Return reference if fetch fails or not an HTTP URI
                return item
              })
            )
          }

          // Resolve partOf collection reference
          if (page.partOf) {
            const collectionId = Array.isArray(page.partOf) ? page.partOf[0]?.id : page.partOf
            if (collectionId?.startsWith('http')) {
              try {
                // Create a fetch with 10 second timeout
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 10000)

                const response = await fetch(collectionId, { signal: controller.signal })
                clearTimeout(timeoutId)

                if (response.ok) {
                  page.partOf = [await response.json()]
                } else {
                  console.warn(`Failed to resolve partOf collection ${collectionId}: HTTP ${response.status}`)
                }
              } catch (err) {
                if (err.name === 'AbortError') {
                  console.warn(`Timeout resolving partOf collection ${collectionId}`)
                } else {
                  console.warn(`Error resolving partOf collection ${collectionId}:`, err.message)
                }
              }
            }
          }
        }

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

      // Check if full resolution is requested via query parameter
      const shouldResolve = req.query.resolve === 'full'

      if (shouldResolve) {
        // Resolve items array: fetch full annotation objects
        if (pageAsAnnotationPage.items?.length > 0) {
          pageAsAnnotationPage.items = await Promise.all(
            pageAsAnnotationPage.items.map(async item => {
              // Only resolve if item has an HTTP URI
              if (item?.id?.startsWith('http')) {
                try {
                  // Create a fetch with 10 second timeout
                  const controller = new AbortController()
                  const timeoutId = setTimeout(() => controller.abort(), 10000)

                  const response = await fetch(item.id, { signal: controller.signal })
                  clearTimeout(timeoutId)

                  if (response.ok) {
                    return await response.json()
                  } else {
                    console.warn(`Failed to resolve annotation ${item.id}: HTTP ${response.status}`)
                  }
                } catch (err) {
                  if (err.name === 'AbortError') {
                    console.warn(`Timeout resolving annotation ${item.id}`)
                  } else {
                    console.warn(`Error resolving annotation ${item.id}:`, err.message)
                  }
                }
              }
              // Return reference if fetch fails or not an HTTP URI
              return item
            })
          )
        }

        // Resolve partOf collection reference
        if (pageAsAnnotationPage.partOf?.[0]?.id) {
          const collectionId = pageAsAnnotationPage.partOf[0].id
          if (collectionId.startsWith('http')) {
            try {
              // Create a fetch with 10 second timeout
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 10000)

              const response = await fetch(collectionId, { signal: controller.signal })
              clearTimeout(timeoutId)

              if (response.ok) {
                pageAsAnnotationPage.partOf = [await response.json()]
              } else {
                console.warn(`Failed to resolve partOf collection ${collectionId}: HTTP ${response.status}`)
              }
            } catch (err) {
              if (err.name === 'AbortError') {
                console.warn(`Timeout resolving partOf collection ${collectionId}`)
              } else {
                console.warn(`Error resolving partOf collection ${collectionId}:`, err.message)
              }
            }
          }
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
