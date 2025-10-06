import app from '../../app.js'
import { jest } from '@jest/globals'
import expressListEndpoints from "express-list-endpoints"

describe.skip('userProfile endpoint availability unit test (via a check on the app routes). #exists_unit', () => {
  it('/user/:id is registered', () => {
    let exists = false
    const stack = expressListEndpoints(app.router)
    for(const middleware of stack){
      if(middleware.path && middleware.path.includes("/user/:id")) {
         exists = true
         break
       } 
    }
    expect(exists).toBe(true)
  })
  it('/my/profile is a registered endpoint', () => {
    let exists = false
    const stack = expressListEndpoints(app.router)
    for(const middleware of stack){
      if(middleware.path && middleware.path.includes("/my/profile")) {
         exists = true
         break
       } 
    }
    expect(exists).toBe(true)
  })
  it('/my/projects is a registered endpoint', () => {
    let exists = false
    const stack = expressListEndpoints(app.router)
    for(const middleware of stack){
      if(middleware.path && middleware.path.includes("/my/projects")) {
         exists = true
         break
       } 
    }
    expect(exists).toBe(true)
  })
})
