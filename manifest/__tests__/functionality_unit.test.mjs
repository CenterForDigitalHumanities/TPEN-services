//need to import app for coverage, not for actual testing tho.
import app from '../../app.mjs'
// This is specifically the Manifest router and related util functions
import {validateProjectID, findTheManifestById} from '../index.mjs'

// You can mock the import of the functions in the index.js manifest router without bringing in the functions

// These test the pieces of functionality in the route that make it work.
describe('Manifest endpoint functionality unit test (just testing helper functions).', () => {

  it('Project validation must be false.', () => {
    expect(validateProjectID()).toBe(false)
  })
  it('Detect TPEN3 project does not exist.  The query for a TPEN3 project must be null.', async () => {
    expect(findTheManifestById(-111)).toBe(null)
  })
  it('TPEN3 project does exist.  Finding the manifest results in the manifest JSON', async () => {
    let json = findTheManifestById(7085)
    try{
      json = JSON.parse(JSON.stringify(json))
    }
    catch(err){
      json = null
    }
    expect(json).not.toBe(null)
  })

})

//What I am wondering is - is this the place to run the route on its own end-to-end style?  See end_to_end_unit test in /manifest.
