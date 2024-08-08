 import {validateID} from '../../utilities/shared.mjs'

// These test the pieces of functionality in the route that make it work.
describe('Testing /user/:id helper functions) #testThis', () => {

  it('returns false for invalid ID and for no ID', () => {
    expect(validateID()).toBe(false)
    expect(validateID("jkl")).toBe(false)
  })
 
  it("returns true for valid id",()=>{
    expect(validateID(123)).toBe(true)
  }) 
})