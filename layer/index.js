import express from 'express'
import * as utils from '../utilities/shared.mjs'
import pageRouter from '../page/index.mjs'
import cors from 'cors'
import common_cors from '../utilities/common_cors.json' with {type: 'json'}

const router = express.Router()

router.use(cors(common_cors))

// Route to get a layer by ID within a project
router.route('/:layerId')
    .get(async (req, res) => {
        const { projectId, layerId } = req.params

        try {
            const layer = await findLayerById(layerId, projectId)
            // Make this internal Layer look more like a RERUM AnnotationCollection
            const layerAsCollection = {
                '@context': 'http://www.w3.org/ns/anno.jsonld',
                id: layer.id,
                type: 'AnnotationCollection',
                label: { none: [layer.label] },
                total: layer.pages.length,
                first: layer.pages.at(0).id,
                last: layer.pages.at(-1).id
            }

            return res.status(200).json(layerAsCollection)
        } catch (error) {
            console.error(error)
            return utils.respondWithError(res, error.status ?? 500, error.message ?? 'Internal Server Error')
        }
    })
    .all((req, res) => {
        utils.respondWithError(res, 405, 'Improper request method. Use GET instead.')
    })

// Nested route for pages within a layer
router.use('/:layerId/page', pageRouter)

export default router

async function findLayerById(layerId, projectId) {
    if (layerId.startsWith(process.env.RERUMIDPREFIX)) {
        return fetch(layerId).then(res => res.json())
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
    return layer
}
