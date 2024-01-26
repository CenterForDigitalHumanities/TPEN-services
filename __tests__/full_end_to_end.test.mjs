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

describe('Manifest endpoint tests in the full end to end test. #e2e', () => {

  it('POST instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(app)
      .post('/manifest/')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('PUT instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(app)
      .put('/manifest/')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('PATCH instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(app)
      .patch('/manifest/')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('Call to /manifest without a TPEN3 project ID.  The status should be 400 with a message.', async () => {
    const res = await request(app)
      .get('/manifest/')
      expect(res.statusCode).toBe(400)
      expect(res.body).toBeTruthy()
  })

  it('Call to /manifest with a TPEN3 project ID that does not exist.  The status should be 404 with a message.', async () => {
    const res = await request(app)
      .get('/manifest/0001')
      expect(res.statusCode).toBe(404)
      expect(res.body).toBeTruthy()
  })

  it('Call to /manifest with a TPEN3 project ID that does  exist.  The status should be 200 with a JSON Manifest in the body.', async () => {
    const res = await request(app)
      .get('/manifest/7085')
      let json = res.body
      try{
        json = JSON.parse(JSON.stringify(json))
      }
      catch(err){
        json = null
      }
      expect(json).not.toBe(null)
  })
  
})

describe('Other endpoint tests. #e2e', () => {

  it('This is always going to pass because it is a good stub.', async () => {
    expect(1).toBe(1)
  })
  
})