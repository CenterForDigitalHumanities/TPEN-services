import express from 'express'
import auth0Middleware from '../auth/index.js'
import cors from 'cors'
import common_cors from '../utilities/common_cors.json' with {type: 'json'}
let router = express.Router({ mergeParams: true })
import Project from '../classes/Project/Project.js'
import Line from '../classes/Line/Line.js'
import { findPageById, respondWithError, getLayerContainingPage, updatePageAndProject, handleVersionConflict, fetchUserAgent } from '../utilities/shared.js'

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
      const { pageObject, creator } = await findPageById(pageId, projectId)
      if (!pageObject) {
        respondWithError(res, 404, 'No page found with that ID.')
        return
      }
      if (pageObject.id?.startsWith(process.env.RERUMIDPREFIX)) {
        // If the page is a RERUM document, we need to fetch it from the server
        const pageFromRerum = await fetch(pageObject.id).then(res => res.json())
        if (pageFromRerum) {
          res.status(200).json(pageFromRerum)
          return
        }
      }
      // build as AnnotationPage
      const pageAsAnnotationPage = {
        '@context': 'http://www.w3.org/ns/anno.jsonld',
        id: pageObject.id,
        type: 'AnnotationPage',
        label: { none: [pageObject.label] },
        target: pageObject.target,
        partOf: pageObject.partOf,
        items: pageObject.items ?? [],
        ...pageObject?.prev?.id && {
          prev: pageObject.prev.id
        },
        ...pageObject?.next?.id && {
          next: pageObject.next.id
        },
        creator: await fetchUserAgent(creator),
      }
      res.status(200).json(pageAsAnnotationPage)
    } catch (error) {
      return respondWithError(res, error.status ?? 500, error.message ?? 'Internal Server Error')
    }
  })
  .put(auth0Middleware(), async (req, res) => {
    const user = req.user
    if (!user) return respondWithError(res, 401, "Unauthenticated request")
    const { projectId, pageId } = req.params
    const update = req.body
    if (!update) {
      respondWithError(res, 400, 'No update data provided.')
      return
    }
    const project = await Project.getById(projectId)
    if (!project) {
      respondWithError(res, 404, `Project with ID '${projectId}' not found`)
      return
    }
    const layer = getLayerContainingPage(project, pageId)
    if (!layer) {
      respondWithError(res, 404, `Layer containing page with ID '${pageId}' not found in project '${projectId}'`)
      return
    }
    const layerId = layer.id
    if (!layerId) {
      respondWithError(res, 404, `Layer containing page with ID '${pageId}' not found in project '${projectId}'`)
      return
    }

    try {
      // Find the page object
      const pageObject = await findPageById(pageId, projectId)
      pageObject.creator = user.agent.split('/').pop()
      pageObject.partOf = layerId
      if (pageObject?.prev?.id) {
        pageObject.prev = pageObject.prev.id
      } else {
        delete pageObject.prev
      }

      if (pageObject?.next?.id) {
        pageObject.next = pageObject.next.id
      } else {
        delete pageObject.next
      }
      if (!pageObject) {
        respondWithError(res, 404, 'No page found with that ID.')
        return
      }
      // Only update top-level properties that are present in the request
      Object.keys(update ?? {}).forEach(key => {
        pageObject[key] = update[key]
      })
      Object.keys(pageObject).forEach(key => {
        if (pageObject[key] === undefined || pageObject[key] === null) {
          // Remove properties that are undefined or null
          delete pageObject[key]
        }
      })

      if (update.items) {
        pageObject.items = await Promise.all(pageObject.items.map(async item => {
          const line = item.id?.startsWith?.('http')
            ? new Line(item)
            : Line.build(projectId, pageId, item, user.agent.split('/').pop())
          return await line.update()
        }))
      }

      await updatePageAndProject(pageObject, project, user._id)

      res.status(200).json(pageObject)
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
