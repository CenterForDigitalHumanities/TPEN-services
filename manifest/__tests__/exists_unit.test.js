/** 
 * Test to check if the /manifest endpoint is registered with the app.
 * 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 * 
 * */

//need to import app to check for the route
import app from '../../app.js'

describe('Manifest endpoint availability unit test (via a check on the app routes). #exists_unit', () => {
  it('/manifest route is registered', () => {
    let exists = false
    const stack = app._router.stack
    for(const middleware of stack){
      if(middleware.regexp && middleware.regexp.toString().includes("/manifest")) {
         exists = true
         break
       } 
    }
    expect(exists).toBe(true)
  })
})
