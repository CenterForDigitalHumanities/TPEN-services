import {findUserById} from '../userProfile.mjs'
import {validateID} from '../../utilities/shared.mjs'

// These test the pieces of functionality in the route that make it work.
describe('userProfile endpoint functionality unit test (just testing helper functions). #functions_unit', () => {

  it('No TPEN3 user ID provided.  User ID validation must be false.', () => {
    expect(validateID()).toBe(false)
  })
  
  it('Throws error and handles if id is 111', async () => {
      const res = await findUserById(111);
      console.log(res)
      expect(res.status).toBe(500)
      expect(res.error).toBe('Internal Server Error')
  
    })
    

    it('Throws error and handles if id is 222', async () => {
      const res = await findUserById(222);
      console.log(res)
      expect(res.status).toBe(500)
      expect(res.error).toBe('Internal Server Error')
  
    })

  it('TPEN3 user does exist.  Finding the user results in the user JSON', async () => {
    let user = await findUserById(123)
    expect(user).not.toBe(null)
  })

  it('TPEN3 user does exist.  Finding the user results in the user JSON', async () => {
    const user = await findUserById(123);
    expect(user).not.toBe(null);
    expect(user.url).toBe('https://store.rerum.io/v1/id/123');
  })

  it('TPEN3 user has correct number of projects', async () => {
    const user = await findUserById(123);
    expect(user.number_of_projects).toBe(2);
  })

  it('TPEN3 user has correct number of public projects', async () => {
    const user = await findUserById(123);
    expect(user.public_projects.length).toBe(2);
  })

  it('TPEN3 user has correct profile', async () => {
    const user = await findUserById(123);
    expect(user.profile).not.toBe(null);
  })


})

