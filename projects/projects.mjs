/** Logic for the /projects endpoint */
import * as fs from 'fs'

// Mock projects list for now
export async function getUserProjects(user) {
  let projects = []
  let project

  // Mock a pause for endpoints that fail, to mock the time it takes for some async stuff to decide it failed.
  const mockPause = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve([])
    }, 1500)
  })

  let projectFileBuffer = fs.readFileSync('./public/project.json', (err, data) => {
    if (err) throw err
  })
  project = projectFileBuffer !== null && [JSON.parse(projectFileBuffer.toString()), JSON.parse(projectFileBuffer.toString())]

  // Mock the scenario where it takes a couple seconds to look for but not find the Project.
  if (project === null) {
    projects = await mockPause
  }
  return projects

}
