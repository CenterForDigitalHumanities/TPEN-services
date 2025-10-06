import app from '../../app.js'
import { jest } from '@jest/globals'
import expressListEndpoints from "express-list-endpoints"

// TODO check every /project endpoint.  

// Example
it.skip('/project/:id is a registered endpoint', () => {
  let exists = false
  const stack = expressListEndpoints(app.router)
  for(const middleware of stack){
    if(middleware.path && middleware.path.includes("/project/:id")) {
       exists = true
       break
     } 
  }
  expect(exists).toBe(true)
})
