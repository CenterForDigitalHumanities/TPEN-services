import express from 'express'
import auth0Middleware from '../auth/index.js'
import screenContentMiddleware from '../utilities/checkIfSuspicious.js'
import { hasSuspiciousLayerData } from '../utilities/checkIfSuspicious.js'
import pageRouter from '../page/index.js'
import cors from 'cors'
import common_cors from '../utilities/common_cors.json' with {type: 'json'}
import Project from '../classes/Project/Project.js'
import Layer from '../classes/Layer/Layer.js'
import { findPageById, findLayerById, updateLayerAndProject, respondWithError } from '../utilities/shared.js'

const router = express.Router({ mergeParams: true })

router.use(cors(common_cors))

// Route to get a layer by ID within a project
router.route('/:layerId')
    .get(async (req, res) => {
        const { projectId, layerId } = req.params
        try {
            const layer = await findLayerById(layerId, projectId, true)
            if (!layer) {
                respondWithError(res, 404, 'No layer found with that ID.')
                return
            }
            if (layer.id?.startsWith(process.env.RERUMIDPREFIX)) {
                // If the page is a RERUM document, we need to fetch it from the server
                res.status(200).json(layer)
                return
            }
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
            if (layer.creator) layerAsCollection.creator = layer.creator
            return res.status(200).json(layerAsCollection)
        } catch (error) {
            console.error(error)
            return respondWithError(res, error.status ?? 500, error.message ?? 'Internal Server Error')
        }
    })
    .put(auth0Middleware(), screenContentMiddleware(), async (req, res) => {
        const { projectId, layerId } = req.params
        let label = req.body?.label
        const update = req.body
        const providedPages = update?.pages
        const user = req.user
        if (!projectId) return respondWithError(res, 400, 'Project ID is required')
        if (!layerId) return respondWithError(res, 400, 'Layer ID is required')
        try {
            if (hasSuspiciousLayerData(req.body)) return respondWithError(res, 400, "Suspicious layer data will not be processed.")
            const project = await Project.getById(projectId)
            if (!project?._id) return respondWithError(res, 404, `Project '${projectId}' does not exist`)
            const layer = await findLayerById(layerId, projectId)
            const originalPages = layer.pages ?? []
            if (!layer?.id) return respondWithError(res, 404, `Layer '${layerId}' not found in project`)
            // Only update top-level properties that are present in the request
            Object.keys(update ?? {}).forEach(key => {
                layer[key] = update[key]
            })
            Object.keys(layer).forEach(key => {
                if (layer[key] === undefined || layer[key] === null) {
                  // Remove properties that are undefined or null.  prev and next can be null
                  if (key !== "first" && key !== "last") delete layer[key]
                  else layer[key] = null
                }
            })
            if (providedPages?.length === 0) providedPages = undefined
            let pages = []
            if (providedPages && providedPages.length) {
                pages = await Promise.all(providedPages.map(p => findPageById(p.split("/").pop(), projectId) ))
                layer.pages = pages
            }
            await updateLayerAndProject(layer, project, user._id, originalPages)
            res.status(200).json(layer)
        } catch (error) {
            console.error(error)
            return respondWithError(res, error.status ?? 500, error.message ?? 'Error updating layer')
        }
    })
    .all((req, res) => {
        respondWithError(res, 405, 'Improper request method. Use GET instead.')
    })

// Route to create a new layer within a project
router.route('/').post(auth0Middleware(), screenContentMiddleware(), async (req, res) => {
    const { projectId } = req.params
    const { label, canvases } = req.body
    if (!projectId) return respondWithError(res, 400, 'Project ID is required')
    if (!label || !Array.isArray(canvases) || canvases.length === 0) {
        return respondWithError(res, 400, 'Invalid layer data. Provide a label and an array of URIs or Page objects.')
    }
    try {
        if (hasSuspiciousLayerData(req.body)) return respondWithError(res, 400, "Suspicious layer data will not be processed.")
        const project = await Project.getById(projectId)
        if (!project) return respondWithError(res, 404, 'Project does not exist')
        const newLayer = Layer.build(projectId, label, canvases)
        project.addLayer(newLayer.asProjectLayer())
        await project.update()
        res.status(201).json(project.data)
    } catch (error) {
        console.error(error)
        return respondWithError(res, error.status ?? 500, error.message ?? 'Error creating layer')
    }
})

// Nested route for pages within a layer
router.use('/:layerId/page', pageRouter)

export default router
