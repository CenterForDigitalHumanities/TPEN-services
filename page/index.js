import express from 'express'
import auth0Middleware from '../auth/index.js'
import screenContentMiddleware from '../utilities/checkIfSuspicious.js'
import { isSuspiciousJSON, hasSuspiciousPageData } from '../utilities/checkIfSuspicious.js'
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

// router.use('/:pageId/line', lineRouter)

export default router
