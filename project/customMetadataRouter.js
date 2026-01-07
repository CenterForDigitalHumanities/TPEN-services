import express from "express"
import { respondWithError, validateID } from "../utilities/shared.js"
import auth0Middleware from "../auth/index.js"
import Project from "../classes/Project/Project.js"
import dbDriver from "../database/driver.js"
import { ACTIONS, ENTITIES, SCOPES } from "./groups/permissions_parameters.js"
import screenContentMiddleware, { isSuspiciousJSON, isSuspiciousValueString } from "../utilities/checkIfSuspicious.js"

const router = express.Router({ mergeParams: true })
const database = new dbDriver("mongo")

/**
 * Helper function to determine the namespace from the request origin
 * @param {Request} req - Express request object
 * @returns {string} - The namespace key to use
 */
function getNamespaceFromOrigin(req) {
    const origin = req.headers.origin || req.headers.referer || ""

    // Check for localhost or local network addresses
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?/.test(origin)

    if (isLocalhost) {
        return "*"
    }

    // Extract hostname from origin
    try {
        const url = new URL(origin)
        return url.hostname
    } catch (e) {
        return "*"
    }
}

/**
 * Helper function to deep merge objects for PUT operations
 * @param {Object} target - Target object to merge into
 * @param {Object} source - Source object to merge from
 * @returns {Object} - Merged object
 * @throws {Error} - If types don't match for upsert
 */
function deepUpsert(target, source) {
    const result = { ...target }

    for (const key in source) {
        if (source[key] === null) {
            // Delete the key if value is null
            delete result[key]
            continue
        }
        if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
            // If both are objects, recursively merge
            if (typeof target[key] === 'object' && !Array.isArray(target[key]) && target[key] !== null) {
                result[key] = deepUpsert(target[key], source[key])
                continue
            }
            if (target[key] === undefined) {
                // Key doesn't exist, so create it
                result[key] = source[key]
                continue
            }
            // Type mismatch
            throw new Error(`Type mismatch for key '${key}': cannot replace ${typeof target[key]} with Object`)
        }
        // Primitive value or array
        if (target[key] !== undefined && typeof target[key] !== typeof source[key]) {
            throw new Error(`Type mismatch for key '${key}': cannot replace ${typeof target[key]} with ${typeof source[key]}`)
        }
        result[key] = source[key]
    }

    return result
}

// GET /project/:id/custom - Returns array of namespace keys
router.route("/:id/custom").get(auth0Middleware(), async (req, res) => {
    const user = req.user
    const { id } = req.params

    if (!user) return respondWithError(res, 401, "Unauthenticated request")
    if (!id) return respondWithError(res, 400, "No TPEN3 ID provided")
    if (!validateID(id)) return respondWithError(res, 400, "The TPEN3 project ID provided is invalid")

    try {
        const project = new Project(id)

        // Check if user has read access to the project options
        if (!await project.checkUserAccess(user._id, ACTIONS.READ, SCOPES.OPTIONS, ENTITIES.PROJECT)) {
            return respondWithError(res, 403, "You do not have permission to read this project's metadata")
        }

        // Fetch the project from database
        const projectData = await database.findOne({ _id: id }, "projects")

        if (!projectData) {
            return respondWithError(res, 404, `No TPEN3 project with ID '${id}' found`)
        }

        // Return array of namespace keys
        const namespaces = projectData.interfaces ? Object.keys(projectData.interfaces) : []
        res.status(200).json(namespaces)
    } catch (error) {
        return respondWithError(
            res,
            error.status ?? 500,
            error.message?.toString() ?? "An error occurred while fetching project metadata namespaces"
        )
    }
})

// POST /project/:id/custom - Create or replace entire origin namespace
router.route("/:id/custom").post(auth0Middleware(), async (req, res) => {
    const user = req.user
    const { id } = req.params
    const payload = req.body


    if (!user) return respondWithError(res, 401, "Unauthenticated request")
    if (!id) return respondWithError(res, 400, "No TPEN3 ID provided")
    if (!validateID(id)) return respondWithError(res, 400, "The TPEN3 project ID provided is invalid")
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return respondWithError(res, 400, "Metadata payload must be a JSON object")
    }

    try {
        for (const key in payload) {
            if (isSuspiciousJSON(payload[key], Object.keys(payload[key])) || isSuspiciousValueString(payload[key], true)) {
                payload[key] = { $$unsafe: payload[key] }
            }
        }
        const project = new Project(id)

        // Check if user has update access to the project options
        if (!await project.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.OPTIONS, ENTITIES.PROJECT)) {
            return respondWithError(res, 403, "You do not have permission to update this project's metadata")
        }

        // Get namespace from request origin
        const namespace = getNamespaceFromOrigin(req)

        // Fetch the full project data
        const projectData = await database.findOne({ _id: id }, "projects")

        if (!projectData) {
            return respondWithError(res, 404, `No TPEN3 project with ID '${id}' found`)
        }

        // Initialize interfaces if it doesn't exist
        projectData.interfaces ??= {}

        // Update the namespace with the new payload
        projectData.interfaces[namespace] = payload

        // Update the full project document
        await database.update(projectData, "projects")

        res.status(200).json({ namespace, data: payload })
    } catch (error) {
        return respondWithError(
            res,
            error.status ?? 500,
            error.message?.toString() ?? "An error occurred while updating project metadata"
        )
    }
})

// PUT /project/:id/custom - Upsert values in origin namespace
router.route("/:id/custom").put(auth0Middleware(), async (req, res) => {
    const user = req.user
    const { id } = req.params
    const payload = req.body

    if (!user) return respondWithError(res, 401, "Unauthenticated request")
    if (!id) return respondWithError(res, 400, "No TPEN3 ID provided")
    if (!validateID(id)) return respondWithError(res, 400, "The TPEN3 project ID provided is invalid")
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return respondWithError(res, 400, "Metadata payload must be a JSON object")
    }

    try {

        for (const key in payload) {
            if (isSuspiciousJSON(payload[key], Object.keys(payload[key])) || isSuspiciousValueString(payload[key], true)) {
                payload[key] = { $$unsafe: payload[key] }
            }
        }
        const project = new Project(id)

        // Check if user has update access to the project options
        if (!await project.checkUserAccess(user._id, ACTIONS.UPDATE, SCOPES.OPTIONS, ENTITIES.PROJECT)) {
            return respondWithError(res, 403, "You do not have permission to update this project's metadata")
        }

        // Get namespace from request origin
        const namespace = getNamespaceFromOrigin(req)

        // Fetch the full project data
        const projectData = await database.findOne({ _id: id }, "projects")

        if (!projectData) {
            return respondWithError(res, 404, `No TPEN3 project with ID '${id}' found`)
        }

        // Initialize interfaces if it doesn't exist
        if (!projectData.interfaces) {
            projectData.interfaces = {}
        }

        // Get current namespace data
        const currentData = projectData.interfaces[namespace] || {}

        // Perform deep upsert
        let mergedData
        try {
            mergedData = deepUpsert(currentData, payload)
        } catch (error) {
            return respondWithError(res, 400, error.message)
        }

        // Update the namespace with merged data
        projectData.interfaces[namespace] = mergedData

        // Update the full project document
        await database.update(projectData, "projects")

        res.status(200).json({ namespace, data: mergedData })
    } catch (error) {
        return respondWithError(
            res,
            error.status ?? 500,
            error.message?.toString() ?? "An error occurred while updating project metadata"
        )
    }
})

router.route("/:id/custom").all((_, res) => {
    return respondWithError(res, 405, "Improper request method. Use GET, POST, or PUT instead")
})

export default router
