import DatabaseController from "../database/mongo/controller.js"
import Project from '../classes/Project/Project.js'
import Layer from '../classes/Layer/Layer.js'
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

// Find a line in a page
export const findLineInPage = (page, lineId) => {
   const line = page.lines?.find(l => l.id.split('/').pop() === lineId.split('/').pop())
   if (!line) {
      return null
   }
   return line
}

/**
 * Pages have been reordered upstream.  They prev/next relationships are not right.
 * Go through the Pages and update them if their prev/next has changed.
 * Record the Page modification as a content change, and make sure it is attributed.
 *
 * @param project - A Project class object
 * @param pages - An Array of Page class objects
 * @param userId - The userId hash that caused the reoder
 */
export const rebuildPageOrder = async (project, pages, userId) => {
   if (!project) throw new Error(`Must know project to rebuild Page order`)
   if (!pages || !Array.isArray(pages)) throw new Error(`Cannot rebuild page order without an array of pages`)
   if (!userId) throw new Error(`Must know user id`)
   for await (const [index, page] of pages.entries()) {
      const thisPageNext = index < pages.length - 1 ? pages[index + 1].id : null
      const thisPagePrev = index > 0 ? pages[index - 1].id : null
      const pageChanged = (page.next !== thisPageNext || page.prev !== thisPagePrev)
      if (!pageChanged) continue
      // A reordered page counts as a content change
      console.log("UPDATE THIS PAGE FOR ORDER")
      console.log(page)
      if (!page.creator) page.creator = await fetchUserAgent(userId)
      // We know these values will be upgraded to RERUM ids, so force it and make sure not to leave temp ids.
      // FIXME: If there is an error upgrading the referenced page downstream, the rerum ID made here might not resolve.
      if (page.next !== thisPageNext) page.next = thisPageNext ? process.env.RERUMIDPREFIX + thisPageNext.split("/").pop() : null
      if (page.prev !== thisPagePrev) page.prev = thisPagePrev ? process.env.RERUMIDPREFIX + thisPagePrev.split("/").pop() : null
      // It is possible that the page.next is still 
      await recordModification(project, page.id, userId)
      await page.update(pageChanged)
   }
}

/**
 * Update a Layer, its Pages, and the Project it belongs to.
 * Content has changed if the organization of layer.pages has been altered.
 * 
 * @param layer - A Layer class object with changes applied to it
 * @param originalPages - An Array of Page _ids that represent the original upstream Layer.pages organization before any modifications.
*/
export const updateLayerAndProject = async (layer, project, userId, originalPages = null) => {
   if (!project) throw new Error(`Must know project to update Layer`)
   if (layer === null || layer === undefined) throw new Error("A Layer must be provided in order to update")
   if (!userId) throw new Error(`Must know user id to update layer`)
   if (originalPages === null || originalPages === undefined || !Array.isArray(originalPages)) originalPages = await findLayerById(layer.id, project._id, true)?.pages
   console.log("UPDATE THIS LAYER")
   console.log(layer)
   let pagesChanged = false
   const originalPageOrder = originalPages.map(p => p.id.split("/").pop())
   const providedPageOrder = layer.pages.map(p => p.id.split("/").pop())
   if(providedPageOrder.join() !== originalPageOrder.join()) {
      // The Pages need updated so that they have the correct prev and next
      pagesChanged = true
      await rebuildPageOrder(project, layer.pages, userId)
   }
   if (!layer.creator) layer.creator = await fetchUserAgent(userId)
   const updatedLayer = await layer.update(pagesChanged)
   const layerIndex = project.data.layers.findIndex(l => l.id.split("/").pop() === layer.id.split("/").pop())
   project.data.layers[layerIndex] = updatedLayer
   await project.update()
}

/**
 * Update a Page and its Project as well as the Layer containing the Page if necessary.
 * Content has changed if page.items have changed in any way
*/
export const updatePageAndProject = async (page, project, userId, contentChanged = false) => {
   if (!project) throw new Error(`Must know project to update Page`)
   if (!page) throw new Error(`A Page must be provided to update`)
   if (!userId) throw new Error(`Must know user id to update layer`)
   console.log("UPDATE THIS PAGE")
   console.log(page)
   const useragent = await fetchUserAgent(userId)
   if (!page.creator) page.creator = useragent
   let data_layer = project.data.layers.find(l => l.pages.some(p => p.id.split('/').pop() === page.id.split('/').pop()))
   const layerIndex = project.data.layers.findIndex(l => l.pages.some(p => p.id.split('/').pop() === page.id.split('/').pop()))
   let layer
   if (contentChanged) {
      console.log("PAGE CONTENT HAS CHANGED")
      layer = await findLayerById(data_layer.id, project._id)
      if (!layer) throw new Error("Cannot update Page.  Its Layer was not found.")
      if (!layer.creator) layer.creator = useragent
      await recordModification(project, page.id, userId)
   }
   const updatedPage = await page.update(contentChanged)
   const pageIndex = data_layer.pages.findIndex(p => p.id.split('/').pop() === page.id.split('/').pop())
   data_layer.pages[pageIndex] = page.asProjectPage()
   if (contentChanged) {
      // We don't strictly have to update the Layer if the content change was only text.
      console.log("PAGE CONTENT HAS CHANGED, SO LAYER NEEDS UPDATED")
      layer.pages[pageIndex] = updatedPage
      data_layer = await layer.update(true)
   }
   project.data.layers[layerIndex] = data_layer
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
export async function findPageById(pageId, projectId, rerum) {
   if (rerum) {
      if (!pageId?.startsWith(process.env.RERUMIDPREFIX)) {
         pageId = process.env.RERUMIDPREFIX + pageId.split("/").pop()
      }
      const rerum_obj = await fetch(pageId).then(res => {
         if (res.ok) return res.json()
         if (!res.ok) return {}
      })
      .catch(err => {
         console.error("Network error with rerum")
         throw err
      })
      if(rerum_obj?.id || rerum_obj["@id"]) return rerum_obj
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
   page.prev = layerContainingPage.pages[pageIndex - 1]?.id ?? null
   page.next = layerContainingPage.pages[pageIndex + 1]?.id ?? null

   return new Page(layerContainingPage.id, page)
}

export async function findLayerById(layerId, projectId, rerum = false) {
   if (rerum) {
      if (!layerId?.startsWith(process.env.RERUMIDPREFIX)) {
         layerId = process.env.RERUMIDPREFIX + layerId.split("/").pop()
      }
      const rerum_obj = await fetch(layerId).then(res => {
         if (res.ok) return res.json()
         if (!res.ok) return {}
      })
      .catch(err => {
         console.error("Network error with rerum")
         throw err
      })
      if(rerum_obj?.id || rerum_obj["@id"]) return rerum_obj
   }
   const p = await Project.getById(projectId)
   if (!p) {
     const error = new Error(`Project with ID '${projectId}' not found`)
     error.status = 404
     throw error
   }
   const layer = layerId.length < 6
     ? p.data.layers[parseInt(layerId) + 1]
     : p.data.layers.find(layer => layer.id.split('/').pop() === layerId.split('/').pop())
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
   return new Layer(projectId, {"id":layer.id, "label":layer.label, "pages":layer.pages})
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
   if (typeof userId === "string" && userId.startsWith("http")) return userId
   try {
      let user = new User(userId)
      user = await user.getSelf()
      if (!user) {
         throw new Error(`User with ID '${userId}' not found`)
      }
      return user.agent
   } catch (error) {
      throw new Error(`Error fetching user agent: ${error.message}`)
   }
}
