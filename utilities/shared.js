import DatabaseController from "../database/mongo/controller.js"
import Project from '../classes/Project/Project.js'
import Page from '../classes/Page/Page.js'
import User from '../classes/User/User.js'
/**
 * Check if the supplied input is valid JSON or not.
 * @param input A string or Object that should be JSON conformant.
 * @return boolean For whether or not the supplied input was JSON conformant.
 */
export function isValidJSON(input = "") {
   if (input) {
      try {
         const json = (typeof input === "string") ? JSON.parse(input) : JSON.parse(JSON.stringify(input))
         return true
      }
      catch (no) { }
   }
   return false
}

/**
 * Check if the supplied input is a valid integer TPEN Project ID
 * @param input A string which should be a valid Integer number
 * @return boolean For whether or not the supplied string was a valid Integer number
 */
export function validateID(id, type = "mongo") {
   if (type == "mongo") {
      return new DatabaseController().isValidId(id)
   } else {
      if (!isNaN(id)) {
         try {
            id = parseInt(id)
            return true
         }
         catch (no) { }
      }
      return false
   }

}

// Send a failure response with the proper code and message
export function respondWithError(res, status, message) {
   res.status(status).json({ message })
}

// Send a successful response with the appropriate JSON
export function respondWithJSON(res, status, json) {
   const id = manifest["@id"] ?? manifest.id ?? null
   res.set("Content-Type", "application/json; charset=utf-8")
   res.status(status)
   res.json(json)
}
// Fetch a project by ID
export const getProjectById = async (projectId, res) => {
   const project = await Project.getById(projectId)
   if (!project) {
      respondWithError(res, 404, `Project with ID '${projectId}' not found`)
      return null
   }
   return project
}

// Fetch a page by ID
export const getPageById = async (pageId, projectId, res) => {
   const page = await findPageById(pageId, projectId)
   if (!page) {
      respondWithError(res, 404, `Page with ID '${pageId}' not found in project '${projectId}'`)
      return null
   }
   return page
}

// Find a line in a page
export const findLineInPage = (page, lineId) => {
   const line = page.lines?.find(l => l.id.split('/').pop() === lineId.split('/').pop())
   if (!line) {
      return null
   }
   return line
}

// Update a page and its project
export const updatePageAndProject = async (page, project, userId) => {
   await page.update()
   const layer = project.data.layers.find(l => l.pages.some(p => p.id.split('/').pop() === page.id.split('/').pop()))
   const pageIndex = layer.pages.findIndex(p => p.id.split('/').pop() === page.id.split('/').pop())
   layer.pages[pageIndex] = page.asProjectPage()
   await recordModification(project, page.id, userId)
   await project.update()
}

// Log modifications for recent changes. We don't need to know much about it. 
// We want to capture the id of the changed page and the user who made the change.
const recordModification = async (project, pageId, userId) => {
   if (!project || !pageId) {
      // silent failure of logging
      console.error(`recordModification failed: projectId or pageId is missing. Submitted values - project: ${project}, page: ${page}, userId: ${userId}`)
      return
   }

   try {
      // set _lastModified for the Project for "recent project"
      project.data._lastModified = pageId.split("/").pop()
   } catch (err) {
      console.error("recordModification failed", err)
      return
   }

   if (!userId) {
      // silent failure of logging
      console.error(`recordModification failed: userId is missing. Submitted values - userId: ${userId}`)
      return
   }

   // set _lastModified for the User for "recent user"
   try {
      const lastModified = `project:${project._id}/page:${pageId.split("/").pop()}`
      return User.setLastModified(userId, lastModified)
   } catch (err) {
      console.error("recordModification failed", err)
      return
   }
}

// Get a Layer that contains a PageId
export const getLayerContainingPage = (project, pageId) => {
   return project.data.layers.find(layer =>
      layer.pages.some(p => p.id.split('/').pop() === pageId.split('/').pop())
   )
}

// Find a page by ID (moved from page/index.js)
export async function findPageById(pageId, projectId) {
   if (pageId?.startsWith(process.env.RERUMIDPREFIX)) {
      return fetch(pageId).then(res => res.json())
   }
   const projectData = (await getProjectById(projectId))?.data
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

/**
 * Handle version conflict errors from optimistic locking consistently
 * @param {Response} res - Express response object
 * @param {Error} error - The error object from the version conflict
 * @returns {Response} JSON response with conflict details
 */
export const handleVersionConflict = (res, error) => {
   return res ? res.status(409).json({
      currentVersion: error,
      code: 'VERSION_CONFLICT',
      details: 'The document was modified by another process.'
   }) : {
      status: 409,
      currentVersion: error,
      code: 'VERSION_CONFLICT',
      details: 'The document was modified by another process.'
   }
}

/**
 * Wrapper function to add optimistic locking retry logic to any async operation
 * @param {Function} operation - The async operation to execute
 * @param {number} maxRetries - Maximum number of retries (default: 1)
 * @returns {Promise} The result of the operation or throws the final error
 */
export const withOptimisticLocking = async (operation, retryFn, maxRetries = 2) => {
   let lastError

   for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
         let currentVersion = lastError?.currentVersion || null
         console.log(currentVersion ? `Retrying operation due to error: ${currentVersion}` : 'Executing operation')
         return await (attempt === 0 ? operation() : retryFn(currentVersion))
      } catch (error) {
         lastError = error

         // Only retry on version conflicts
         if (error.status === 409 && attempt < maxRetries) {
            // Could add backoff here if needed
            console.warn(`Version conflict detected, retrying operation... Attempt ${attempt + 1}/${maxRetries}`)
            await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)))
            continue
         }

         // If it's not a version conflict or we've exhausted retries, throw
         throw error
      }
   }

   throw lastError
}

/** * Fetch the user agent for a given user ID
 * @param {string} userId - The ID of the user to fetch the agent for
 * @returns {Promise<string>} The user agent string
 * @throws {Error} If the user ID is not provided or the user cannot be found
 */

export const fetchUserAgent = async (userId) => {
   if (!userId) {
      throw new Error('User ID is required to fetch user agent')
   }
   try {
      let user = new User(userId)
      user =await user.getSelf()
      if (!user) {
         throw new Error(`User with ID '${userId}' not found`)
      }
      return user.agent
   } catch (error) {
      throw new Error(`Error fetching user agent: ${error.message}`)
   }
}
