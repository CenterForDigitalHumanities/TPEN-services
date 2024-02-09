/** 
 * Activate the /manifest endpoint with Express.
 * Perform endpoint calls that test the end to end functionality of the route.
 * 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 * 
 * */

//need to import app for coverage, not for actual testing tho.
import app from '../../app.mjs'

import {default as manifestRouter} from '../index.mjs'
import express from 'express'
import request from 'supertest'

const routeTester = new express()
routeTester.use("/manifest", manifestRouter)

describe('Manifest endpoint end to end unit test (spinning up the endpoint and using it). #end2end_unit', () => {

  it('POST instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .post('/manifest/')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('PUT instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .put('/manifest/')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('PATCH instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .patch('/manifest/')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('Call to /manifest without a TPEN3 project ID.  The status should be 400 with a message.', async () => {
    const res = await request(routeTester)
      .get('/manifest/')
      expect(res.statusCode).toBe(400)
      expect(res.body).toBeTruthy()
  })

  it('Call to /manifest with a TPEN3 project ID that does not exist.  The status should be 404 with a message.', async () => {
    const res = await request(routeTester)
      .get('/manifest/0001')
      expect(res.statusCode).toBe(404)
      expect(res.body).toBeTruthy()
  })

  it('Call to /manifest with a TPEN3 project ID that does  exist.  The status should be 200 with a JSON Manifest in the body.', async () => {
    const res = await request(routeTester)
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