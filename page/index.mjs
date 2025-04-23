import express from 'express'
import * as utils from '../utilities/shared.mjs'
import * as service from './page.mjs'
import cors from 'cors'
import common_cors from '../utilities/common_cors.json' with {type: 'json'}

let router = express.Router()

router.use(
  cors(common_cors)
)

router.route('/:id?')
  .get(async (req, res, next) => {
    const { projectId, layerId, pageId } = req.params
      const pageObject = await findPageById(pageId, layerId, projectId)
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
  })
  .all((req, res, next) => {
    utils.respondWithError(res, 405, 'Improper request method, please use GET.')
  })

export default router

async function findPageById(pageId, layerId, projectId) {
  if (pageId.startsWith(process.env.RERUMIDPREFIX)) {
    return fetch(pageId).then(res => res.json())
  }
  const p = await Project.getById(projectId)
  if (!p) {
      const error = new Error(`Project with ID '${projectId}' not found`)
      error.status = 404
      throw error
  }
  const layer = p.layers.find(layer => layer.id === layerId)
  if (!layer) {
      const error = new Error(`Layer with ID '${layerId}' not found in project '${projectId}'`)
      error.status = 404
      throw error
  }
  const page = layer.pages.find(page => page.id === pageId)
  if (!page) {
      const error = new Error(`Page with ID '${pageId}' not found in layer '${layerId}'`)
      error.status = 404
      throw error
  }
  return page
}
