import app from '../../app.mjs'

describe('Line endpoint availability unit test (via a check on the app routes). #exists_unit', () => {
  it('responds to /line/id', () => {
    let exists = false
    const stack = app._router.stack
    for(const middleware of stack){
      if(middleware.regexp && middleware.regexp.toString().includes("/line")) {
         exists = true
         break
       } 
    }
    expect(exists).toBe(true)
  })
})