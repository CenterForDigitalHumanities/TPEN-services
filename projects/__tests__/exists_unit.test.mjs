import app from '../../app.mjs'

describe('Projects endpoint availability unit test (via a check on the app routes). #exists_unit', () => {
  it('responds to /projects', () => {
    let exists = false
    const stack = app._router.stack
    for(const middleware of stack){
      if(middleware.regexp && middleware.regexp.toString().includes("/projects")) {
         exists = true
         break
       } 
    }
    expect(exists).toBe(true)
  })
})