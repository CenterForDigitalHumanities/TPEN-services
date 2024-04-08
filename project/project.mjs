import * as utils from '../utilities/shared.mjs'
import dbDriver from '../database/driver.mjs'
import * as fs from 'fs'

const database = new dbDriver()

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

export async function getUserProjects(userAgent, options) {
  try {
    let projectList = [{ id: "123", title: "MyProject" }]

    return projectList
  } catch (error) {
    return { status: 500, message: 'Error retrieving user projects from the database', error: error.message }
  }
}

export async function responseMapping(projects) {
  const projectList = projects.map(project => ({
    id: project.id,
    title: project.title
  }))

  return projectList
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
