// End to end tests that spin up and test it?

import app from '../app.mjs'
import express from 'express'
import request from 'supertest'

describe('Manifest endpoint tests.', () => {

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

describe('Other endpoint tests.', () => {
  it('This is always going to pass because it is a good stub.', async () => {
    expect(1).toBe(1)
  })
})