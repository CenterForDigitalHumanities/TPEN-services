import express from "express"
import { respondWithError } from "../utilities/shared.js"
import auth0Middleware from "../auth/index.js"
import ProjectFactory from "../classes/Project/ProjectFactory.js"

const router = express.Router({ mergeParams: true })

router.route("/:projectId/copy").post(auth0Middleware(), async (req, res) => {
    const user = req.user
    if (!user) {
        return respondWithError(res, 401, "Unauthorized: User not authenticated")
    }
    try {
        const { projectId } = req.params
        const project = await ProjectFactory.copyProject(projectId, user._id)
        res.status(201).json(project)
    } catch (error) {
        respondWithError(
            res,
            error.status ?? error.code ?? 500,
            error.message ?? "Unknown server error"
        )
    }
}).all((_, res) => {
  respondWithError(res, 405, "Improper request method. Use POST instead")
})

router.route("/:projectId/copy-without-annotations").post(auth0Middleware(), async (req, res) => {
    const user = req.user
    if (!user) {
        return respondWithError(res, 401, "Unauthorized: User not authenticated")
    }
    try {
        const { projectId } = req.params
        const project = await ProjectFactory.copyProjectWithoutAnnotations(projectId, user._id)
        res.status(201).json(project)
    } catch (error) {
        respondWithError(
            res,
            error.status ?? error.code ?? 500,
            error.message ?? "Unknown server error"
        )
    }
}).all((_, res) => {
  respondWithError(res, 405, "Improper request method. Use POST instead")
})

router.route("/:projectId/copy-with-group").post(auth0Middleware(), async (req, res) => {
    const user = req.user
    if (!user) {
        return respondWithError(res, 401, "Unauthorized: User not authenticated")
    }
    try {
        const { projectId } = req.params
        const project = await ProjectFactory.copyProjectWithGroup(projectId, user._id)
        res.status(201).json(project)
    } catch (error) {
        respondWithError(
            res,
            error.status ?? error.code ?? 500,
            error.message ?? "Unknown server error"
        )
    }
}).all((_, res) => {
  respondWithError(res, 405, "Improper request method. Use POST instead")
})

export default router
