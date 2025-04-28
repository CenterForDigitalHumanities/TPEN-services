import pageRouter from '../index.mjs'
import express from 'express'
import request from 'supertest'

const routeTester = new express()
routeTester.use("/", pageRouter)

describe('page endpoint end to end unit test (spinning up the endpoint and using it). #end2end_unit', () => {

  it('POST instead of GET. That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .post('/dummyId')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('PUT instead of GET. That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .put('/dummyId')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('PATCH instead of GET. That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .patch('/dummyId')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('Call to /page without a TPEN3 page ID. The status should be 404.', async () => {
    const res = await request(routeTester)
      .get('/')
      expect(res.statusCode).toBe(404)
      expect(res.body).toBeTruthy()
  })

  // These two cannot work without a corresponding project, so it will need to be rewritten
  it.skip('Call to /page with a TPEN3 page ID that does not exist. The status should be 404 with a message.', async () => {
    const res = await request(routeTester)
      .get('/0001')
      expect(res.statusCode).toBe(404)
      expect(res.body).toBeTruthy()
  })

  it.skip('Call to /page with a TPEN3 page ID that does exist. The status should be 200 with a JSON page in the body.', async () => {
    const res = await request(routeTester)
      .get('/123')
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
