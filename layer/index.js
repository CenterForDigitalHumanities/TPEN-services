import express from 'express'
import * as utils from '../utilities/shared.js'
import auth0Middleware from "../auth/index.js"
import pageRouter from '../page/index.js'
import cors from 'cors'
import common_cors from '../utilities/common_cors.json' with {type: 'json'}
import Project from '../classes/Project/Project.js'
import Layer from '../classes/Layer/Layer.js'

const router = express.Router({ mergeParams: true })

router.use(cors(common_cors))

// Route to get a layer by ID within a project
router.route('/:layerId')
    .get(async (req, res) => {
        const { projectId, layerId } = req.params

        try {
            const { layer, creator } = await findLayerById(layerId, projectId)
            // Make this internal Layer look more like a RERUM AnnotationCollection
            const layerAsCollection = {
                '@context': 'http://www.w3.org/ns/anno.jsonld',
                id: layer.id,
                type: 'AnnotationCollection',
                label: { none: [layer.label] },
                creator: `https://store.rerum.io/v1/id/${creator}`,
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
    .put(auth0Middleware(), async (req, res) => {
        const { projectId, layerId } = req.params
        let { label, canvases } = req.body

        if (!projectId) return utils.respondWithError(res, 400, 'Project ID is required')

        if (!layerId) return utils.respondWithError(res, 400, 'Layer ID is required')


        try {
            const project = new Project(projectId)
            const layers = await project.loadProject()

            if (!layers) return utils.respondWithError(res, 404, 'Project does not exist')

            const layer = await findLayerById(layerId, projectId, true)

            if (!layer) return utils.respondWithError(res, 404, 'Layer not found in project')

            label ??= label ?? layer.label
            if(canvases?.length === 0) canvases = undefined
            const updatedLayer = canvases ?
                Layer.build(projectId, label, canvases, req.agent.split('/').pop())
                : new Layer(projectId, {id:layer.id, label, pages:layer.pages, creator: req.agent.split('/').pop()})

            await updatedLayer.update()
            project.updateLayer(updatedLayer.asProjectLayer(), layerId)
            await project.update()

            res.status(200).json(project.data)
        } catch (error) {
            return utils.respondWithError(res, error.status ?? 500, error.message ?? 'Error updating layer')
        }
    })
    .all((req, res) => {
        utils.respondWithError(res, 405, 'Improper request method. Use GET instead.')
    })

// Route to create a new layer within a project
router.route('/').post(auth0Middleware(), async (req, res) => {
    const { projectId } = req.params
    const { label, canvases } = req.body

    if (!projectId) return utils.respondWithError(res, 400, 'Project ID is required')

    if (!label || !Array.isArray(canvases) || canvases.length === 0) {
        return utils.respondWithError(res, 400, 'Invalid layer data. Provide a label and an array of URIs or Page objects.')
    }

    try {
        const project = await Project.getById(projectId)

        if (!project) return utils.respondWithError(res, 404, 'Project does not exist')

        const newLayer = Layer.build(projectId, label, canvases, req.agent.split('/').pop())
        project.addLayer(newLayer.asProjectLayer())
        await project.update()

        res.status(201).json(project.data)
    } catch (error) {
        return utils.respondWithError(res, error.status ?? 500, error.message ?? 'Error creating layer')
    }
})

// Nested route for pages within a layer
router.use('/:layerId/page', pageRouter)

export default router

async function findLayerById(layerId, projectId, skipLookup = false) {
    if (!skipLookup && layerId.startsWith(process.env.RERUMIDPREFIX)) {
        return fetch(layerId).then(res => res.json())
    }
    const p = (await Project.getById(projectId)).data
    if (!p) {
        const error = new Error(`Project with ID '${projectId}' not found`)
        error.status = 404
        throw error
    }
    const layer = layerId.length < 6
        ? p.layers[parseInt(layerId) + 1]
        : p.layers.find(layer => layer.id.split('/').pop() === layerId.split('/').pop())
    if (!layer) {
        const error = new Error(`Layer with ID '${layerId}' not found in project '${projectId}'`)
        error.status = 404
        throw error
    }
    // Ensure the layer has pages and is not malformed
    if (!layer.pages || layer.pages.length === 0) {
        const error = new Error(`Layer with ID '${layerId}' is malformed: no pages found`)
        error.status = 422
        throw error
    }
    
    return { layer, creator: p.creator }
}
