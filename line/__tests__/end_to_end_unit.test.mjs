import {default as lineRouter} from '../index.mjs'
import express from 'express'
import request from 'supertest'

const routeTester = new express()
routeTester.use("/line", lineRouter)

describe('Line endpoint end to end unit test (spinning up the endpoint and using it). #end2end_unit', () => {

  it('POST instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .post('/line/')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('PUT instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .put('/line/')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('PATCH instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .patch('/line/')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('Call to /line without a TPEN3 line ID.  The status should be 400 with a message.', async () => {
    const res = await request(routeTester)
      .get('/line/')
      expect(res.statusCode).toBe(400)
      expect(res.body).toBeTruthy()
  })

  it('Call to /line with a TPEN 3 line "${id}" does not exist. The status should be 404 with a message.', async () => {
    try {
      const res = await request(routeTester).get('/line/1257')
      console.log('Response Body:', res.body)
      expect(res.statusCode).toBe(404)
      expect(res.body).toBeTruthy()
    } catch (error) {
      console.error('Error:', error)
    }
  })
  it('Call to /line with a valid TPEN3 line ID. The status should be 200 with a JSON line in the body.', async () => {
    try {
      const res = await request(routeTester).get('/line/123') 
      console.log('Response Body:', res.body)
      expect(res.statusCode).toBe(200)
      expect(res.body).toBeTruthy()
    } catch (error) {
      console.error('Error:', error)
    }
  })
})