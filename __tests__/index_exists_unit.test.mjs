//need to import app for coverage, not for actual testing tho.
import app from '../app.mjs'

import express from 'express'

// This is specifically the /manifest router
//import {default as indexRouter} from '../index.mjs'

// supertest can call routes
//import request from 'supertest'

//const routeTester = new express()
//routeTester.use("/", indexRouter)

// describe('Index routing unit test.', () => {
//   it('The status should be 200 and is text.', async () => {
//     const res = await request(routeTester)
//       .get('/')
//       expect(res.statusCode).toBe(200)
//       expect(res.text).toBeTruthy()
//   })
// })

import {respondWithText} from '../index.mjs'

/**
 * The route uses the json, set, status and location functions on the res object. 
 * type() - Sets the type (content-type) of response
 * status() - Sets the status code of the response
 * send() - Set the text of the response
 * 
 * The test creates a simple mock response object that duplicates what the Express response object would do in the real application.
 */ 
describe('App index availability test', () => {
  it('responds to /', () => {
    let params = {}
    const req = {}
    const res = { 
      type: function(input){
        this.type = input
      },
      status: function(code){
        this.statusCode = code
      },
      send: function(input) { 
        this.text = input
      }
    }
    respondWithText(res) 
    expect(res.statusCode).toBe(200)
    expect(res.type).toMatch(/text/)
  })
})