//need to import app for coverage, not for actual testing tho.
import app from '../../app.mjs'
// This is specifically the Manifest router and related util functions
import {findPageById} from '../page.mjs'
import {validatePageID} from '../../utilities/shared.mjs'

// These test the pieces of functionality in the route that make it work.
describe('Page endpoint functionality unit test (just testing helper functions). #functions_unit', () => {

  it('No TPEN3 page id provided.  Page validation must be false.', () => {
    expect(validatePageID()).toBe(false)
  })
  it('Detect TPEN3 page does not exist.  The query for a TPEN3 page must be null.', async () => {
    const page = await findPageById(-111)
    expect(page).toBe(null)
  })
  it('TPEN3 page does exist.  Finding the page results in the page JSON', async () => {
    let page = await findPageById(123)
    expect(page).not.toBe(null)
  })

})

// If you are doing just findManifestById, but you screw up the route, that won't be detected here.
// The end to end test would fail, this would succeed.  You now have a very narrow band to look at.
// It is worth having both, but removing the redundant test 
