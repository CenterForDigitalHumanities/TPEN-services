import projectsRouter from '../index.mjs'
import express from 'express'
import request from 'supertest'
import 'dotenv/config'

process.env.AUDIENCE = "provide audience to test"

const routeTester = new express()
routeTester.use("/projects", projectsRouter)

const requestOptions = {
  auth: {
    payload: {
      sub: "user123",
      roles: ["admin", "user"]
    },

    token: process.env.TEST_TOKEN,

    headers: {
      authorization: "Bearer " + process.env.TEST_TOKEN
    }
  }
}

describe('Projects endpoint end to end unit test (spinning up the endpoint and using it). #end2end_unit', () => {

  it('POST instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .post('/projects/')
    expect(res.statusCode).toBe(405)
    expect(res.body).toBeTruthy()
  })

  it('PUT instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .put('/projects/')
    expect(res.statusCode).toBe(405)
    expect(res.body).toBeTruthy()
  })

  it('PATCH instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .patch('/projects/')
    expect(res.statusCode).toBe(405)
    expect(res.body).toBeTruthy()
  })

  it('Unauthenticated GET request.  The status should be 401 with a message.', async () => {
    const res = await request(routeTester)
      .get('/projects/')
    expect(res.statusCode).toBe(401)
    expect(res.body).toBeTruthy()
  })

  it('Authenticated GET request with no queries.  The status should be 200.', async () => {
    const res = await request(routeTester)
      .get('/projects/')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
      // .set(requestOptions)
      .set('authorization', "Bearer " + process.env.TEST_TOKEN)
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
  })
  
})