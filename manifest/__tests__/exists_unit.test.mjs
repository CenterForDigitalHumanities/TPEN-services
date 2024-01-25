//need to import app for coverage, not for actual testing tho.
import app from '../../app.mjs'

// import {default as manifestRouter} from '../index.mjs'
//import request from 'supertest'
// const routeTester = new express()
// routeTester.use("/manifest", manifestRouter)
// describe('Manifest endpoint availability tests.', () => {
//   it('The status should be 400 with a message.', async () => {
//     const res = await request(routeTester)
//       .get('/manifest/')
//       expect(res.statusCode).toBe(400)
//       expect(res.text).toBeTruthy()
//   })
// })

import {respondWithJSON} from '../index.mjs'
import express from 'express'

/**
 * The route uses the json, set, status and location functions on the res object. 
 * set() - Adds a key:value pair to the 'headers' object
 * location() - Sets the Location header
 * status() - Sets the status code
 * json() - make a JSON body and sets the type to application/json
 * 
 * The test creates a simple mock response object that duplicates what the Express response object would do in the real application.
 */ 
describe('Manifest endpoint availability tests', () => {
  it('responds to /manifest/id', () => {
    let params = {}
    const req = {}
    const res = { 
      set: function(header, val){
        this.headers[header] = val
      },
      location: function(id){
        this.headers["Location"] = id
      },
      status: function(code){
        this.statusCode = code
      },
      json: function(obj) { 
        this.body = obj
        this.type = "application/json"
      },
      headers:{}
    }
    respondWithJSON(res, {"@id":7085}) 
    expect(res.statusCode).toBe(200)
    expect(res.type).toMatch(/json/)
  })
})
