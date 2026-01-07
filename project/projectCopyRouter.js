import express from "express"
import { respondWithError } from "../utilities/shared.js"
import auth0Middleware from "../auth/index.js"
import ProjectFactory from "../classes/Project/ProjectFactory.js"
import Project from "../classes/Project/Project.js"
import { ACTIONS, ENTITIES, SCOPES } from "./groups/permissions_parameters.js"

const router = express.Router({ mergeParams: true })

router.route("/:projectId/copy").post(auth0Middleware(), async (req, res) => {
    const user = req.user
    if (!user) {
        return respondWithError(res, 401, "Unauthorized: User not authenticated")
    }
    try {
        const { projectId } = req.params
        const projectObj = new Project(projectId)
        if (!(await projectObj.checkUserAccess(user._id, ACTIONS.READ, SCOPES.ALL, ENTITIES.PROJECT))) {
            return respondWithError(res, 403, "You do not have permission to copy this project")
        }
        const project = await ProjectFactory.copyProject(projectId, user._id)
        res.status(201).json(project)
    } catch (error) {
        return respondWithError(
            res,
            error.status ?? 500,
            error.message ?? "Unknown server error"
        )
    }
}).all((_, res) => {
  return respondWithError(res, 405, "Improper request method. Use POST instead")
})

router.route("/:projectId/copy-without-annotations").post(auth0Middleware(), async (req, res) => {
    const user = req.user
    if (!user) {
        return respondWithError(res, 401, "Unauthorized: User not authenticated")
    }
    try {
        const { projectId } = req.params
        const projectObj = new Project(projectId)
        if (!(await projectObj.checkUserAccess(user._id, ACTIONS.READ, SCOPES.ALL, ENTITIES.PROJECT))) {
            return respondWithError(res, 403, "You do not have permission to copy this project")
        }
        const project = await ProjectFactory.cloneWithoutAnnotations(projectId, user._id)
        res.status(201).json(project)
    } catch (error) {
        return respondWithError(
            res,
            error.status ?? 500,
            error.message ?? "Unknown server error"
        )
    }
}).all((_, res) => {
  return respondWithError(res, 405, "Improper request method. Use POST instead")
})

router.route("/:projectId/copy-with-group").post(auth0Middleware(), async (req, res) => {
    const user = req.user
    if (!user) {
        return respondWithError(res, 401, "Unauthorized: User not authenticated")
    }
    try {
        const { projectId } = req.params
        const projectObj = new Project(projectId)
        if (!(await projectObj.checkUserAccess(user._id, ACTIONS.READ, SCOPES.ALL, ENTITIES.PROJECT))) {
            return respondWithError(res, 403, "You do not have permission to copy this project")
        }
        const project = await ProjectFactory.cloneWithGroup(projectId, user._id)
        res.status(201).json(project)
    } catch (error) {
        return respondWithError(
            res,
            error.status ?? 500,
            error.message ?? "Unknown server error"
        )
    }
}).all((_, res) => {
  return respondWithError(res, 405, "Improper request method. Use POST instead")
})

router.route("/:projectId/copy-with-customizations").post(auth0Middleware(), async (req, res) => {
    const user = req.user
    if (!user) {
        return respondWithError(res, 401, "Unauthorized: User not authenticated")
    }
    if (!req.body || typeof req.body !== 'object') {
        return respondWithError(res, 400, "Request body is required")
    }
    const { modules } = req.body
    if (!modules || typeof modules !== 'object') {
        return respondWithError(res, 400, "Bad Request: 'modules' must be an object")
    }
    try {
        const { projectId } = req.params
        const projectObj = new Project(projectId)
        if (!(await projectObj.checkUserAccess(user._id, ACTIONS.READ, SCOPES.ALL, ENTITIES.PROJECT))) {
            return respondWithError(res, 403, "You do not have permission to copy this project")
        }
        const project = await ProjectFactory.cloneWithCustomizations(projectId, user._id, modules)
        res.status(201).json(project)
    } catch (error) {
        return respondWithError(
            res,
            error.status ?? 500,
            error.message ?? "Unknown server error"
        )
    }
}).all((_, res) => {
  return respondWithError(res, 405, "Improper request method. Use POST instead")
})

export default router
