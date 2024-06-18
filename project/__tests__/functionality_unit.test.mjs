import * as logic from '../project.mjs'
import {validateID} from '../../utilities/shared.mjs'

let test_project = { "type": "Project", "title": "test project" }

// These test the pieces of functionality in the route that make it work.
describe('Project endpoint functionality unit test (just testing helper functions). #functions_unit', () => {

  it('No TPEN3 project id provided.  Project validation must be false.', () => {
    expect(validateID()).toBe(false)
  })
  it('Detect TPEN3 project does not exist.  The query for a TPEN3 project must be null.', async () => {
    const project = await logic.findTheProjectByID(-111)
    expect(project).toBe(null)
  })
  it('TPEN3 project does exist.  Finding the project results in the project JSON', async () => {
    let project = await logic.findTheProjectByID(7085)
    expect(project).not.toBe(null)
  })

  it('Saves a project to the database', async () => {
    test_project = await logic.saveProject(test_project)
    expect(test_project["_id"]).toBeTruthy()
  })
})
