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

// Constants for URL resolution
const FETCH_TIMEOUT_MS = 10000 // 10 seconds

/**
 * Validates that a URL is safe to fetch from
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if the URL is valid and safe
 */
function isValidUrl(url) {
  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false
    }
    // Prevent localhost and private IP ranges to mitigate SSRF
    const hostname = parsed.hostname.toLowerCase()
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
    ) {
      return false
    }
    return true
  } catch (err) {
    return false
  }
}

/**
 * Fetches a URL with a timeout
 * @param {string} url - The URL to fetch
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<Response>} - The fetch response
 */
async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    return response
  } catch (err) {
    clearTimeout(timeout)
    throw err
  }
}

/**
 * Validates that an object conforms to the Web Annotation data model
 * @param {object} obj - The object to validate
 * @returns {boolean} - True if the object is a valid Annotation
 */
function isValidAnnotation(obj) {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.type === 'Annotation' &&
    typeof obj.id === 'string'
  )
}

/**
 * Validates that an object conforms to the AnnotationCollection schema
 * @param {object} obj - The object to validate
 * @returns {boolean} - True if the object is a valid AnnotationCollection
 */
function isValidAnnotationCollection(obj) {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.type === 'AnnotationCollection' &&
    typeof obj.id === 'string'
  )
}

router.use(
  cors(common_cors)
)

// This is a nested route for pages within a layer. It may be used 
// directly from /project/:projectId/page or with /layer/:layerId/page
// depending on the context of the request.
router.route('/:pageId')
  .get(async (req, res) => {
    const { projectId, pageId } = req.params
    const { resolved } = req.query
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
      let pageAsAnnotationPage = {
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

      // If resolved=true, fetch and embed full objects instead of references
      if (resolved === 'true') {
        try {
          // Resolve all Annotation objects in items array
          const itemPromises = pageAsAnnotationPage.items.map(async (item) => {
            if (item.id && typeof item.id === 'string' && item.id.startsWith('http')) {
              // Validate URL before fetching
              if (!isValidUrl(item.id)) {
                console.error(`Invalid or unsafe URL for Annotation: ${item.id}`)
                return item
              }
              try {
                const response = await fetchWithTimeout(item.id, FETCH_TIMEOUT_MS)
                if (response.ok) {
                  const data = await response.json()
                  // Validate the fetched data structure
                  if (isValidAnnotation(data)) {
                    return data
                  } else {
                    console.error(`Invalid Annotation structure from ${item.id}`)
                  }
                }
              } catch (err) {
                if (err.name === 'AbortError') {
                  console.error(`Timeout resolving Annotation ${item.id}`)
                } else {
                  console.error(`Failed to resolve Annotation ${item.id}:`, err.message)
                }
              }
            }
            return item // Fallback to original reference if fetch fails
          })

          // Resolve AnnotationCollection in partOf
          const partOfPromises = pageAsAnnotationPage.partOf.map(async (collection) => {
            if (collection.id && typeof collection.id === 'string' && collection.id.startsWith('http')) {
              // Validate URL before fetching
              if (!isValidUrl(collection.id)) {
                console.error(`Invalid or unsafe URL for AnnotationCollection: ${collection.id}`)
                return collection
              }
              try {
                const response = await fetchWithTimeout(collection.id, FETCH_TIMEOUT_MS)
                if (response.ok) {
                  const data = await response.json()
                  // Validate the fetched data structure
                  if (isValidAnnotationCollection(data)) {
                    return data
                  } else {
                    console.error(`Invalid AnnotationCollection structure from ${collection.id}`)
                  }
                }
              } catch (err) {
                if (err.name === 'AbortError') {
                  console.error(`Timeout resolving AnnotationCollection ${collection.id}`)
                } else {
                  console.error(`Failed to resolve AnnotationCollection ${collection.id}:`, err.message)
                }
              }
            }
            return collection // Fallback to original reference if fetch fails
          })

          // Wait for all resolutions with graceful error handling
          const [resolvedItems, resolvedPartOf] = await Promise.all([
            Promise.allSettled(itemPromises),
            Promise.allSettled(partOfPromises)
          ])

          // Extract fulfilled values or use original references
          pageAsAnnotationPage.items = resolvedItems.map((result, index) =>
            result.status === 'fulfilled' ? result.value : pageAsAnnotationPage.items[index]
          )

          pageAsAnnotationPage.partOf = resolvedPartOf.map((result, index) =>
            result.status === 'fulfilled' ? result.value : pageAsAnnotationPage.partOf[index]
          )

        } catch (resolutionError) {
          // If resolution fails entirely, log error but continue with references
          console.error('Error during resolution:', resolutionError.message)
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
