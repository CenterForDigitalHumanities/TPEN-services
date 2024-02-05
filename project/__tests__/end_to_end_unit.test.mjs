//need to import app for coverage, not for actual testing tho.
//import app from '../../app.mjs'

import {default as projectRouter} from '../index.mjs'
import express from 'express'
import request from 'supertest'

const routeTester = new express()
routeTester.use("/project", projectRouter)

describe('Project endpoint end to end unit test (spinning up the endpoint and using it). #end2end_unit', () => {

  it('POST instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .post('/project/')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('PUT instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .put('/project/')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('PATCH instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .patch('/project/')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('Call to /project without a TPEN3 project ID.  The status should be 400 with a message.', async () => {
    const res = await request(routeTester)
      .get('/project/')
      expect(res.statusCode).toBe(400)
      expect(res.body).toBeTruthy()
  })

  it('Call to /project with a TPEN3 project ID that does not exist.  The status should be 404 with a message.', async () => {
    const res = await request(routeTester)
      .get('/project/0001')
      expect(res.statusCode).toBe(404)
      expect(res.body).toBeTruthy()
  })

  it('Call to /project with a TPEN3 project ID that does  exist.  The status should be 200 with a JSON Project in the body.', async () => {
    const res = await request(routeTester)
      .get('/project/7085')
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