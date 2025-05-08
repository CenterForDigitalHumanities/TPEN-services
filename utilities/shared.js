import DatabaseController from "../database/mongo/controller.js"
import Project from '../classes/Project/Project.js'
import User from "../classes/User/User.js"
import { findPageById } from '../page/index.js'

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
   console.log("Page updated and modification recorded:", project._lastModified, page.id)
   await project.update()
}

// Log modifications for recent changes. We don't need to know much about it. 
// We want to capture the id of the changed page and the user who made the change.
const recordModification = async ( project, pageId, userId) => {
   if (!project || !pageId) {
      // silent failure of logging
      console.error(`recordModification failed: projectId or pageId is missing. Submitted values - project: ${project}, page: ${page}, userId: ${userId}`)
      return
   }

   try {
      // set _lastModified for the Project for "recent project"
      project._lastModified = pageId
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
      return User.setLastModified(userId, pageId)
   } catch (err) {
      console.error("recordModification failed", err)
      return
   }
}
