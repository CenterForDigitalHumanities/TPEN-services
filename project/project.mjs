import * as utils from '../utilities/shared.mjs'
import * as fs from 'fs'
import DatabaseDriver from "../database/driver.mjs"

const database = new DatabaseDriver("mongo")

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
 * Save project to Mongo database
 */
export async function saveProject(projectJSON) {
  return await database.save(projectJSON)
}