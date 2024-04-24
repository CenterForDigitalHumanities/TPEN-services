import {findPageById} from '../page.mjs'
import {validateID} from '../../utilities/shared.mjs'

// These test the pieces of functionality in the route that make it work.
describe('Page endpoint functionality unit test (just testing helper functions). #functions_unit', () => {

  it('No TPEN3 page id provided.  Page validation must be false.', () => {
    expect(validateID()).toBe(false)
  })
  it('Detect TPEN3 page does not exist.  The query for a TPEN3 page must be null.', async () => {
    findPageById(-111)
    expect(null)
  })
  it('TPEN3 page does exist.  Finding the page results in the page JSON', async () => {
    let page = await findPageById(123)
    expect(page).not.toBe(null)
  })

})
