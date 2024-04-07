import projectsRouter from '../index.mjs'
import express from 'express'
import request from 'supertest'

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

describe('Authenticated projects endpoint end to end unit test (spinning up the endpoint and using it). #end2end_unit', () => {

  // it('POST instead of GET.  That status should be 405 with a message.', async () => {
  //   const res = await request(routeTester)
  //     .post('/projects/')
  //     .auth(process.env.TEST_TOKEN, { type: 'bearer' })
  //     expect(res.statusCode).toBe(405)
  //     expect(res.body).toBeTruthy()
  // })

  // it('PUT instead of GET.  That status should be 405 with a message.', async () => {
  //   const res = await request(routeTester)
  //     .put('/projects/')
  //     expect(res.statusCode).toBe(405)
  //     expect(res.body).toBeTruthy()
  // })

  // it('PATCH instead of GET.  That status should be 405 with a message.', async () => {
  //   const res = await request(routeTester)
  //     .patch('/projects/')
  //     expect(res.statusCode).toBe(405)
  //     expect(res.body).toBeTruthy()
  // })
  
})