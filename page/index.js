import express from 'express'
import * as utils from '../utilities/shared.js'
import cors from 'cors'
import common_cors from '../utilities/common_cors.json' with {type: 'json'}

let router = express.Router({ mergeParams: true })
import Project from '../classes/Project/Project.js'

router.use(
  cors(common_cors)
)

// This is a nested route for pages within a layer. It may be used 
// directly from /project/:projectId/page or with /layer/:layerId/page
// depending on the context of the request.
router.route('/:pageId')
  .get(async (req, res, next) => {
    const { projectId, pageId } = req.params
    try {
      const pageObject = await findPageById(pageId, projectId)
      if (!pageObject) {
        utils.respondWithError(res, 404, 'No page found with that ID.')
      return
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
      prev: pageObject.prev ?? null,
      next: pageObject.next ?? null
    }
    res.status(200).json(pageAsAnnotationPage)
  } catch (error) {
    return utils.respondWithError(res, error.status ?? 500, error.message ?? 'Internal Server Error')
  }
  })
  .all((req, res, next) => {
    utils.respondWithError(res, 405, 'Improper request method, please use GET.')
  })

export default router

async function findPageById(pageId, projectId) {
  if (pageId?.startsWith(process.env.RERUMIDPREFIX)) {
    return fetch(pageId).then(res => res.json())
  }
  const projectData = (await Project.getById(projectId))?.data
  if (!projectData) {
    const error = new Error(`Project with ID '${projectId}' not found`)
    error.status = 404
    throw error
  }
  const layerContainingPage = projectData.layers.find(layer =>
    layer.pages.some(page => page.id.split('/').pop() === pageId.split('/').pop())
  )

  if (!layerContainingPage) {
    const error = new Error(`Layer containing page with ID '${pageId}' not found in project '${projectId}'`)
    error.status = 404
    throw error
  }

  const pageIndex = layerContainingPage.pages.findIndex(page =>
    page.id.split('/').pop() === pageId.split('/').pop()
  )

  if (pageIndex < 0) {
    const error = new Error(`Page with ID '${pageId}' not found in project '${projectId}'`)
    error.status = 404
    throw error
  }

  const page = layerContainingPage.pages[pageIndex]
  page.prev = layerContainingPage.pages[pageIndex - 1] ?? null
  page.next = layerContainingPage.pages[pageIndex + 1] ?? null

  return page
}
