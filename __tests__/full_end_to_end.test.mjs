// End to end tests that spin up and test it?

import app from '../app.mjs'
import express from 'express'
import request from 'supertest'

/**
 * The route uses the json, set, status and location functions on the res object. 
 * type() - Sets the type (content-type) of response
 * status() - Sets the status code of the response
 * send() - Set the text of the response
 * 
 * The test creates a simple mock response object that duplicates what the Express response object would do in the real application.
 */ 
describe('App index test. #e2e', () => {

  it('responds to / with a 200 status and and the index.html page.', async () => {
    const res = await request(app)
      .get('/')
      expect(res.statusCode).toBe(200)
      expect(res.type).toMatch(/html/)
  })

})

describe('Invalid site path test. #e2e', () => {

  it('returns a graceful 404', async () => {
    const res = await request(app)
      .get('/potato/')
      expect(res.statusCode).toBe(404)
  })

})


describe('Endpoint tests. #e2e', () => {
  it('This is always going to pass because it is a good stub.', async () => {
    expect(true).toBe(true)
  })
  
})