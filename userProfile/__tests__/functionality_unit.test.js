import {validateID} from '../../utilities/shared.js'

// These test the pieces of functionality in the route that make it work.
describe('Testing /user/:id helper functions) #testThis', () => {

  it('returns false for invalid ID and for no ID', () => {
    expect(validateID()).toBe(false)
    expect(validateID("jkl")).toBe(false)
  })
 
  it("returns true for valid id",()=>{
    // Use a valid 24-character hex string (MongoDB ObjectId format)
    expect(validateID("507f1f77bcf86cd799439011")).toBe(true)
  }) 
})
