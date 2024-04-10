import * as utils from '../utilities/shared.mjs'
import * as fs from 'fs'

export async function findTheProjectByID(id = null) {
  let project = null
  if (!utils.validateID(id)) return project
  const mockPause = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(null)
    }, 1500)
  })

  if (id && id === 7085) {
    let projectFileBuffer = fs.readFileSync('./public/project.json', (err, data) => {
      if (err) throw err
    })
    project = projectFileBuffer !== null && JSON.parse(projectFileBuffer.toString())
  }
  if (project === null) {
    project = await mockPause
  }
  return project
}

/**
 * Retrieves user projects based on the provided user agent and options.
 * @param {Object} userAgent - The user agent object.
 * @param {Object} options - The options for filtering user projects.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of user projects.
 */
export async function getUserProjects(userAgent, options) {
  try {
    // To mock retrieving user projects
    let projectList = [{ id: "123", title: "MyProject" }]

    return projectList
  } catch (error) {
    // Handle  errors that occur during project retrieval
    return { status: 500, message: 'Error retrieving user projects from the database', error: error.message }
  }
}

/**
 * Maps project data to a simplified format suitable for response.
 * @param {Array<Object>} projects - An array of project objects.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of simplified project objects.
 */
export async function responseMapping(projects) {
  try {
    // Map project data to a simple format
    const projectList = projects.map(project => ({
      id: project.id,
      title: project.title
    }))

    return projectList
  } catch (error) {
    // Handle  errors that occur during response mapping
    return { status: 500, message: 'Error mapping project data for response', error: error.message }
  }
}

export async function respondWithProjects(user, options, res) {
  let projects = await logic.getUserProjects(user)

  if (hasRoles !== 'ALL') {
    projects = projects.filter(project => (
      project.roles.some(role => hasRoles.includes(role))
    ))
  }
  if (exceptRoles !== 'NONE') {
    projects = projects.filter(project => (
      !project.roles.some(role => exceptRoles.includes(role))
    ))
  }
  if (createdBefore === 'NOW') {
    createdBefore = Date.now()
  }
  projects = projects.filter(project => createdAfter < project.created && project.created < createdBefore)

  if (modifiedBefore === 'NOW') {
    modifiedBefore = Date.now()
  }
  projects = projects.filter(project => modifiedAfter < project.lastModified && project.lastModified < modifiedAfter)
  if (count) {
    projects = projects.length
  } else {
    projects = projects.map(project => ({ "id": project.id, "title": project.title })) 
  }

  res.status(200).send(projects)
}
