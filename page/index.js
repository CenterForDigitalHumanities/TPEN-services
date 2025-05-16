import express from 'express'
import * as utils from '../utilities/shared.js'
import cors from 'cors'
import common_cors from '../utilities/common_cors.json' with {type: 'json'}

let router = express.Router({ mergeParams: true })
import Project from '../classes/Project/Project.js'
import Page from '../classes/Page/Page.js'
import Line from '../classes/Line/Line.js'
// import lineRouter from '../line/index.js'

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
  .put(async (req, res) => {
    const { projectId, pageId } = req.params
    const update = req.body
    if (!update) {
      utils.respondWithError(res, 400, 'No update data provided.')
      return
    }
    const project = await Project.getById(projectId)
    if (!project) {
      utils.respondWithError(res, 404, `Project with ID '${projectId}' not found`)
      return
    }

    try {
      // Find the page object
      const pageObject = await findPageById(pageId, projectId)
      if (!pageObject) {
        utils.respondWithError(res, 404, 'No page found with that ID.')
        return
      }
      // Only update top-level properties that are present in the request
      Object.keys(update ?? {}).forEach(key => {
        if (key in pageObject) {
          pageObject[key] = update[key]
        }
      })
      pageObject.items = (pageObject.items ?? []).map(async item => {
        const id = item?.id?.startsWith('http') ? item.id : undefined
        const line = id ? new Line({ ...item, id }) : Line.build(projectId, pageId, item)
        item = await line.update()
        return { item }
      })
      await Page.update(pageObject)
      
      await project.update()
      
      res.status(200).json(pageObject)
    } catch (error) {
      return utils.respondWithError(res, error.status ?? 500, error.message ?? 'Internal Server Error')
    }
  })
  .all((req, res, next) => {
    utils.respondWithError(res, 405, 'Improper request method, please use GET.')
  })

// router.use('/:pageId/line', lineRouter)

export default router

export async function findPageById(pageId, projectId) {
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
    layer.pages.some(p => p.id.split('/').pop() === pageId.split('/').pop())
  )

  if (!layerContainingPage) {
    const error = new Error(`Layer containing page with ID '${pageId}' not found in project '${projectId}'`)
    error.status = 404
    throw error
  }

  const pageIndex = layerContainingPage.pages.findIndex(p => p.id.split('/').pop() === pageId.split('/').pop())

  if (pageIndex < 0) {
    const error = new Error(`Page with ID '${pageId}' not found in project '${projectId}'`)
    error.status = 404
    throw error
  }

  const page = layerContainingPage.pages[pageIndex]
  page.prev = layerContainingPage.pages[pageIndex - 1] ?? null
  page.next = layerContainingPage.pages[pageIndex + 1] ?? null

  return new Page(layerContainingPage.id, page)
}
