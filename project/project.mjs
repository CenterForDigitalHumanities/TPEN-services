/** Logic for the /project endpoint */
import * as utils from '../utilities/shared.mjs'
import * as fs from 'fs'

export async function findTheProjectByID(id = null) {
  let project = null
  if (!utils.validateID(id)) return project

  // Mock a pause for endpoints that fail, to mock the time it takes for some async stuff to decide it failed.
  const mockPause = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(null)
    }, 1500)
  })

  if (id && id === 7085) {
    let projectFileBuffer = fs.readFileSync('./public/project.json', (err, data) => {
      if (err) {
        console.error(err)
        return null
      }
    })
    project = projectFileBuffer !== null && JSON.parse(projectFileBuffer.toString())
  }

  // Mock the scenario where it takes a couple seconds to look for but not find the Project.
  if (project === null) {
    project = await mockPause
  }
  return project
}

export async function createProject(proj){
  let newProj = await MongoDBController.create(process.env.TPENPROJECTS, proj)
  return newProj
}
