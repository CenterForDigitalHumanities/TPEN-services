import app from '../../app.mjs'

describe('page endpoint availability unit test (via a check on the app routes). #exists_unit', () => {
  it('responds to /page/id', () => {
    let exists = false
    const stack = app._router.stack
    for(const middleware of stack){
      if(middleware.regexp && middleware.regexp.toString().includes("/page")) {
         exists = true
         break
       } 
    }
    expect(exists).toBe(true)
  })
})