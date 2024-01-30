//need to import app for coverage, not for actual testing tho.
import app from '../../app.mjs'
// This is specifically the Manifest router and related util functions
import {findTheManifestByID} from '../manifest.mjs'
import {validateProjectID} from '../../utilities/shared.mjs'

// These test the pieces of functionality in the route that make it work.
describe('Manifest endpoint functionality unit test (just testing helper functions). #functions_unit', () => {

  it('No TPEN3 project id provided.  Project validation must be false.', () => {
    expect(validateProjectID()).toBe(false)
  })
  it('Detect TPEN3 project does not exist.  The query for a TPEN3 project must be null.', async () => {
    const manifest = await findTheManifestByID(-111)
    expect(manifest).toBe(null)
  })
  it('TPEN3 project does exist.  Finding the manifest results in the manifest JSON', async () => {
    let manifest = await findTheManifestByID(7085)
    expect(manifest).not.toBe(null)
  })

})

// If you are doing just findManifestById, but you screw up the route, that won't be detected here.
// The end to end test would fail, this would succeed.  You now have a very narrow band to look at.
// It is worth having both, but removing the redundant test 
