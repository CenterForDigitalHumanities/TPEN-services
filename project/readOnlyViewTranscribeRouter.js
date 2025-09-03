import express from "express"
import { respondWithError } from "../utilities/shared.js"
import ProjectFactory from "../classes/Project/ProjectFactory.js"

const router = express.Router({ mergeParams: true })

// Get all lines text and (xywh) from a project (Read-Only Users)
router.route('/:projectId/lines').get(async (req, res) => {
    try {
        const project = await ProjectFactory.loadAsUser(req.params.projectId, null)
        const manifest = await ProjectFactory.readFileFromGitHub(project._id)
        res.status(200).json(manifest)
    } catch (error) {
        res.status(error.status ?? 500).json({ error: error.message })
    }
}).all((_, res) => {
  respondWithError(res, 405, "Improper request method. Use GET instead")
})

export default router