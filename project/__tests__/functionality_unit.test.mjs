//need to import app for coverage, not for actual testing tho.
import app from '../../app.mjs'
// This is specifically the Project router and related util functions
import {findTheProjectByID} from '../project.mjs'
import {validateProjectID} from '../../utilities/shared.mjs'

// These test the pieces of functionality in the route that make it work.
describe('Project endpoint functionality unit test (just testing helper functions). #functions_unit', () => {

  it('No TPEN3 project id provided.  Project validation must be false.', () => {
    expect(validateProjectID()).toBe(false)
  })
  it('Detect TPEN3 project does not exist.  The query for a TPEN3 project must be null.', async () => {
    const project = await findTheProjectByID(-111)
    expect(project).toBe(null)
  })
  it('TPEN3 project does exist.  Finding the project results in the project JSON', async () => {
    let project = await findTheProjectByID(7085)
    expect(project).not.toBe(null)
  })

})

// If you are doing just findTheProjectById, but you screw up the route, that won't be detected here.
// The end to end test would fail, this would succeed.  You now have a very narrow band to look at.
// It is worth having both, but removing the redundant test 
