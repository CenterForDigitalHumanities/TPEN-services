import dbDriver from "../database/driver.js"
import Project from '../classes/Project/Project.js'
import Layer from '../classes/Layer/Layer.js'
import Page from '../classes/Page/Page.js'
import User from '../classes/User/User.js'

const databaseTiny = new dbDriver("tiny")

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
      return databaseTiny.isValidId(id)
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
 * Update a Layer, its Pages, and the Project it belongs to.
 * Upgrade a Layer only if it contains upgraded Pages.
 *
 * @param layer - A Layer class object with changes applied to it
 * @param project - A Project class object that will need to update
 * @param userId - The TPEN3 User hash id performing the action
 */
export const updateLayerAndProject = async (layer, project, userId) => {
   if (!project) throw new Error(`Must know project to update Layer`)
   if (layer === null || layer === undefined) throw new Error("A Layer must be provided in order to update")
   if (!userId) throw new Error(`Must know user id to update layer`)
   if (!layer.creator) layer.creator = await fetchUserAgent(userId)
   const layerIndex = project.data.layers.findIndex(l => l.id.split("/").pop() === layer.id.split("/").pop())
   const updatedLayer = await layer.update()
   if(project.data.layers[layerIndex]?.id !== updatedLayer.id) {
      // update the references to the Layer in the Project
      // Pages all have their partOf set to the Layer.id
      const pageOverwrites = []
      updatedLayer.pages.forEach(async page => {
         page.partOf[0].id = updatedLayer.id
         if(page.id.startsWith(process.env.RERUMIDPREFIX)) {
            // overwrite the Page in RERUM
            const oldPage = await databaseTiny.find({_id: page.id.split("/").pop()})
            if(!oldPage) throw new Error(`Page with ID ${page.id} not found in RERUM`)
            oldPage.partOf = [{ id: updatedLayer.id, type: "AnnotationCollection" }]
            pageOverwrites.push(databaseTiny.overwrite(oldPage).catch(_err => { throw new Error(`Failed to overwrite page ${oldPage.id} in RERUM`) }))
         }
         // Note that if the page is not in RERUM and is removed from the Layer, it just disappears without
         // tending to any of its Annotations. If it is in RERUM and removed from the Layer it is orphaned
         // but retains its reference to the Annotation Collection in its partOf.
      })
      await Promise.all(pageOverwrites).catch(err => {
         console.error("Error overwriting pages in RERUM", err)
      }) 
   }
   project.data.layers[layerIndex] = updatedLayer
   await project.update()
}

/**
 * Update a Page and its Project as well as the Layer containing the Page if necessary.
 * Content has changed if page.items have changed in any way.
 *
 * @param page - A Page class object with changes applied to it.
 * @param project - A Project class object that will need to be updated.
 * @param userId - The TPEN3 user hash id performing the action
 */
export const updatePageAndProject = async (page, project, userId) => {
   if (!project) throw new Error(`Must know project to update Page`)
   if (!page) throw new Error(`A Page must be provided to update`)
   if (!userId) throw new Error(`Must know user id to update layer`)
   page.creator ??= await fetchUserAgent(userId)

   const layerIndex = project.data.layers.findIndex(l => l.pages.some(p => p.id.split('/').pop() === page.id.split('/').pop()))
   if (layerIndex < 0 || layerIndex === undefined || layerIndex === null) throw new Error("Cannot update Page.  Its Layer was not found.")
   const layer = project.data.layers[layerIndex]
   const pageIndex = layer.pages.findIndex(p => p.id.split('/').pop() === page.id.split('/').pop())

   // Predict the RERUM page ID (same logic as Page.#setRerumId)
   const rerumPageId = page.id.startsWith(process.env.RERUMIDPREFIX)
      ? page.id
      : `${process.env.RERUMIDPREFIX}${page.id.split("/").pop()}`

   // Create formatted page with predicted ID for layer reference
   const formattedPage = {
      id: rerumPageId,
      label: page.label,
      target: page.target,
      items: page.items ?? []
   }

   // Update layer's pages array BEFORE creating Layer
   layer.pages[pageIndex] = formattedPage

   if (rerumPageId.startsWith(process.env.RERUMIDPREFIX)) {
      // Page and Layer updates are independent - run in parallel
      console.log(`\x1b[36m[PERF] updatePageAndProject: starting PARALLEL page+layer update\x1b[0m`)
      const parallelStart = Date.now()

      const updatedLayer = new Layer(project._id, layer)
      updatedLayer.creator ??= await fetchUserAgent(userId)

      // PARALLEL: Both write to different RERUM documents
      const [, finalLayer] = await Promise.all([
         page.update(),           // Saves page to RERUM
         updatedLayer.update()    // Saves layer to RERUM
      ])

      console.log(`\x1b[36m[PERF] updatePageAndProject: PARALLEL done: ${Date.now() - parallelStart}ms\x1b[0m`)

      project.data.layers[layerIndex] = finalLayer
      await recordModification(project, rerumPageId, userId)
   }

   console.log(`\x1b[36m[PERF] updatePageAndProject: starting project.update()\x1b[0m`)
   const projectUpdateStart = Date.now()
   await project.update()
   console.log(`\x1b[36m[PERF] updatePageAndProject: project.update() done: ${Date.now() - projectUpdateStart}ms\x1b[0m`)
}

// Log modifications for recent changes. We don't need to know much about it. 
// We want to capture the id of the changed page and the user who made the change.
const recordModification = async (project, pageId, userId) => {
   if (!project || !pageId) {
      // silent failure of logging
      console.error(`recordModification failed: projectId or pageId is missing. Submitted values - project: ${project}, pageId: ${pageId}, userId: ${userId}`)
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
   return project.data?.layers.find(layer =>
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
      if (rerum_obj?.id || rerum_obj["@id"]) return rerum_obj
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
      if (rerum_obj?.id || rerum_obj["@id"]) return rerum_obj
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
   return new Layer(projectId, { "id": layer.id, "label": layer.label, "pages": layer.pages })
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

/**
 * Handle version conflict errors from optimistic locking consistently
 * @param {Response} res - Express response object
 * @param {Error} error - The error object from the version conflict
 * @returns {Response} JSON response with conflict details
 */
export const handleVersionConflict = (res, error) => {
  return res.status(409).json({
    error: error.message,
    currentVersion: error.currentVersion,
    code: 'VERSION_CONFLICT',
    details: 'The document was modified by another process.',
    // Include additional context if available
    ...(error.pageId && { pageId: error.pageId }),
    ...(error.layerId && { layerId: error.layerId }),
    ...(error.lineId && { lineId: error.lineId })
  })
}

/**
 * Fetch a single annotation from RERUM by its ID
 * @param {string} annotationId - The ID/URL of the annotation to fetch (supports both RERUM and TPEN3 formats)
 * @returns {Promise<Object>} The full annotation object from RERUM
 * @throws {Error} If the annotation cannot be fetched or parsed
 */
export const resolveReference = async (annotationId) => {
  if (!annotationId || !annotationId.startsWith("http")) {
    throw new Error('Proper Annotation URI is required')
  }
  try {
    const response = await fetch(annotationId)
    if (!response.ok) {
      throw new Error(`Failed to fetch annotation from RERUM: ${response.statusText}`)
    }
    const annotation = await response.json()
    return annotation
  } catch (error) {
    console.error(`Error fetching annotation: ${annotationId}`, error)
    throw new Error(`Failed to fetch annotation from RERUM: ${error.message}`)
  }
}

/**
 * Resolve all annotations in a page's items array by fetching their full data from RERUM
 * @param {Array} items - Array of annotation items (can be IDs or partial objects)
 * @returns {Promise<Array>} Array of fully resolved annotation objects
 */
export const resolveReferences = async (items) => {
  if (!Array.isArray(items)) return []

  // Process all items in parallel for better performance
  const resolvedItems = await Promise.all(
    items.map(async (item) => {
      // If item is a string, it's an annotation ID - fetch from RERUM
      if (typeof item === 'string') {
        try {
          return await resolveReference(item)
        } catch (error) {
          console.error(`Failed to resolve annotation ${item}:`, error)
          // Return the ID string if fetching fails
          return { id: item, error: error.message }
        }
      }
      // If item is an object with an id, try to fetch the full annotation
      if (item && typeof item === 'object' && item.id) {
        try {
          const fullAnnotation = await resolveReference(item.id)
          // Merge with resolved annotation properties taking precedence over local
          return { ...item, ...fullAnnotation }
        } catch (error) {
          console.error(`Failed to resolve annotation ${item.id}:`, error)
          return item
        }
      }
      // For any other format, return as-is
      return item
    })
  )

  return resolvedItems
}

/**
 * Deep equality comparison that is order-insensitive for object properties.
 * Arrays are compared in order, but object key order does not matter.
 *
 * @param {*} a - First value to compare
 * @param {*} b - Second value to compare
 * @returns {boolean} True if values are deeply equal
 */
const deepEqual = (a, b) => {
  if (a === b) return true
  if (a == null || b == null) return a === b
  if (typeof a !== typeof b) return false

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false
    return a.every((val, i) => deepEqual(val, b[i]))
  }

  if (typeof a === 'object') {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if (keysA.length !== keysB.length) return false
    return keysA.every(key => Object.hasOwn(b, key) && deepEqual(a[key], b[key]))
  }

  return false
}

/**
 * Compare two annotations to detect meaningful content changes.
 * Only compares body and target - other fields (id, creator, motivation, etc.)
 * are not considered content changes.
 *
 * Uses order-insensitive deep comparison since both body and target can be
 * complex objects and property order should not affect equality.
 *
 * NOTE: This function is intentionally placed in shared.js rather than as a
 * private method in Line.js to enable unit testing without mocking.
 *
 * @param {Object} existing - The existing annotation
 * @param {Object} compare - The incoming annotation to compare
 * @returns {boolean} True if there are meaningful changes, false otherwise
 */
export const hasAnnotationChanges = (existing, compare) => {
  return !deepEqual(existing?.body, compare?.body) ||
         !deepEqual(existing?.target, compare?.target)
}
