import userProfileRouter from '../index.mjs'
import express from 'express'
import request from 'supertest'

const routeTester = new express()
routeTester.use("/user", userProfileRouter)

describe('userProfile endpoint end to end unit test (spinning up the endpoint and using it). #end2end_unit', () => {

  it('POST instead of GET. That status should be 501 with a message.', async () => {
    const res = await request(routeTester)
      .post('/user/')
    expect(res.statusCode).toBe(501)
    expect(res.body).toBeTruthy()
  })

  it('PUT instead of GET. That status should be 501 with a message.', async () => {
    const res = await request(routeTester)
      .put('/user/')
    expect(res.statusCode).toBe(501)
    expect(res.body).toBeTruthy()
  })

  it('PATCH instead of GET. That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .patch('/user/')
    expect(res.statusCode).toBe(405)
    expect(res.body).toBeTruthy()
  })
 
  it('Call to /user with a TPEN3 user ID that does not exist. The status should be 400 with a message.', async () => {
    const res = await request(routeTester)
      .get('/user/')
    expect(res.statusCode).toBe(400)
    expect(res.body).toBeTruthy()
  })

  it('Call to /user with a TPEN3 user ID thatis  an alpha', async () => {
    const res = await request(routeTester)
      .get('/user/abc')
    expect(res.statusCode).toBe(400)
    expect(res.body).toBeTruthy()
  })

  it('Call to /user with a TPEN3 user ID that does exist. The status should be 200 with a JSON user profile in the body.', async () => {
    const res = await request(routeTester)
      .get('/user/123')
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
  })
})