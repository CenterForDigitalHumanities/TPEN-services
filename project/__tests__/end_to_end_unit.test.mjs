import projectRouter from '../index.mjs'
import express from 'express'
import request from 'supertest'

const routeTester = express()
routeTester.use("/project", projectRouter)

describe('Project endpoint end to end unit test (spinning up the endpoint and using it). #end2end_unit', () => {

  it('GET instead of POST to /project/:id. The status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .post('/project/7085')
    expect(res.statusCode).toBe(405)
    expect(res.body).toBeTruthy()
  })

  it('GET instead of PUT to /project/:id. The status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .put('/project/7085')
    expect(res.statusCode).toBe(405)
    expect(res.body).toBeTruthy()
  })

  it('GET instead of PATCH to /project/:id. The status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .patch('/project/7085')
    expect(res.statusCode).toBe(405)
    expect(res.body).toBeTruthy()
  })
  it('Call to /project without a TPEN3 project ID. The status should be 400 with a message.', async () => {
    const res = await request(routeTester)
      .get('/project/999')
    expect(res.statusCode).toBe(400)
    expect(res.body).toBeTruthy()
  })

})
