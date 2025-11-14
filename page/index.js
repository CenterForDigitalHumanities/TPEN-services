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
    return handlePageRead(req, res)
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

router.route('/:pageId/resolved')
  .get(async (req, res) => {
    return handlePageRead(req, res, { forceResolved: true })
  })
  .all((req, res) => {
    respondWithError(res, 405, 'Improper request method, please use GET.')
  })

// router.use('/:pageId/line', lineRouter)

export default router

const truthyQueryValues = new Set(['1', 'true', 'yes', 'y', 'on', 'resolve', 'resolved'])

function wantsResolvedResponse(req, forceResolved = false) {
  if (forceResolved) return true
  const candidates = [req.query?.resolved, req.query?.resolve, req.query?.embed]
  return candidates.some(value => {
    if (Array.isArray(value)) {
      return value.some(item => truthyQueryValues.has(String(item).toLowerCase()))
    }
    return value ? truthyQueryValues.has(String(value).toLowerCase()) : false
  })
}

async function handlePageRead(req, res, { forceResolved = false } = {}) {
  const { projectId, pageId } = req.params
  const resolveRequested = wantsResolvedResponse(req, forceResolved)
  try {
    const page = await findPageById(pageId, projectId, true)
    if (!page) {
      respondWithError(res, 404, 'No page found with that ID.')
      return
    }
    let annotationPage = normalizeAsAnnotationPage(page)
    if (resolveRequested) {
      annotationPage = await resolveAnnotationReferences(annotationPage)
    }
    res.status(200).json(annotationPage)
  } catch (error) {
    return respondWithError(res, error.status ?? 500, error.message ?? 'Internal Server Error')
  }
}

function normalizeAsAnnotationPage(page) {
  if (page?.['@context'] || page?.type === 'AnnotationPage') {
    return clonePayload(page)
  }
  const label = typeof page.label === 'string' ? { none: [page.label] } : page.label
  const partOfEntries = normalizePartOf(page.partOf)
  return {
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    id: page.id,
    type: 'AnnotationPage',
    label,
    target: page.target,
    partOf: partOfEntries.map(entry => typeof entry === 'string' ? { id: entry, type: 'AnnotationCollection' } : entry),
    items: clonePayload(page.items ?? []),
    prev: page.prev ?? null,
    next: page.next ?? null,
    ...(page.creator ? { creator: page.creator } : {})
  }
}

function normalizePartOf(partOf) {
  if (!partOf) return []
  if (Array.isArray(partOf)) return partOf.filter(Boolean)
  return [partOf].filter(Boolean)
}

async function resolveAnnotationReferences(annotationPage) {
  const resolvedPage = clonePayload(annotationPage)
  resolvedPage.items = await Promise.all((annotationPage.items ?? []).map(async (item) => {
    const annotationId = extractResourceId(item)
    if (!shouldResolveResource(annotationId)) {
      return item
    }
    return await resolveRemoteResource(annotationId, 'Annotation')
  }))

  const partOfEntries = normalizePartOf(annotationPage.partOf)
  resolvedPage.partOf = await Promise.all(partOfEntries.map(async entry => {
    const collectionId = extractResourceId(entry)
    if (!shouldResolveResource(collectionId)) {
      return entry
    }
    return await resolveRemoteResource(collectionId, 'AnnotationCollection')
  }))

  return resolvedPage
}

function extractResourceId(resource) {
  if (!resource) return null
  if (typeof resource === 'string') return resource
  return resource.id ?? resource['@id'] ?? null
}

function shouldResolveResource(resourceId) {
  if (!resourceId) return false
  return /^https?:\/\//i.test(resourceId)
}

async function resolveRemoteResource(uri, label) {
  try {
    const response = await fetch(uri)
    if (!response.ok) {
      const error = new Error(`Failed to resolve ${label} '${uri}': ${response.statusText ?? 'Request failed'}`)
      error.status = response.status ?? 502
      throw error
    }
    return await response.json()
  } catch (error) {
    if (!error.status) {
      const wrappedError = new Error(`Failed to resolve ${label} '${uri}': ${error.message}`)
      wrappedError.status = 502
      throw wrappedError
    }
    throw error
  }
}

function clonePayload(payload) {
  try {
    return structuredClone(payload)
  } catch (err) {
    return JSON.parse(JSON.stringify(payload))
  }
}
