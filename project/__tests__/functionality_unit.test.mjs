
import {validateID} from '../../utilities/shared.mjs'

// These test the pieces of functionality in the route that make it work.
describe('Project endpoint functionality unit test (just testing helper functions). #functions_unit', () => {

  it('No TPEN3 project id provided.  Project validation must be false.', () => {
    expect(validateID()).toBe(false)
  })
})

