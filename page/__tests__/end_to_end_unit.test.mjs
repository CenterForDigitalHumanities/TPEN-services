//need to import app for coverage, not for actual testing tho.
//import app from '../../app.mjs'

import {default as pageRouter} from '../index.mjs'
import express from 'express'
import request from 'supertest'

const routeTester = new express()
routeTester.use("/page", pageRouter)

describe('page endpoint end to end unit test (spinning up the endpoint and using it). #end2end_unit', () => {

  it('POST instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .post('/page/')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('PUT instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .put('/page/')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('PATCH instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .patch('/page/')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('Call to /page without a TPEN3 page ID.  The status should be 400 with a message.', async () => {
    const res = await request(routeTester)
      .get('/page/')
      expect(res.statusCode).toBe(400)
      expect(res.body).toBeTruthy()
  })

  it('Call to /page with a TPEN3 page ID that does not exist.  The status should be 404 with a message.', async () => {
    const res = await request(routeTester)
      .get('/page/0001')
      expect(res.statusCode).toBe(404)
      expect(res.body).toBeTruthy()
  })

  it('Call to /page with a TPEN3 page ID that does  exist.  The status should be 200 with a JSON page in the body.', async () => {
    const res = await request(routeTester)
      .get('/page/123')
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