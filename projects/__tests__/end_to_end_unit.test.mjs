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

describe('Projects endpoint end to end unit test (spinning up the endpoint and using it). #end2end_unit', () => {

  it('POST instead of GET. That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .post('/projects/')
    expect(res.statusCode).toBe(405)
    expect(res.body).toBeTruthy()
  })

  it('PUT instead of GET. That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .put('/projects/')
    expect(res.statusCode).toBe(405)
    expect(res.body).toBeTruthy()
  })

  it('PATCH instead of GET. That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .patch('/projects/')
    expect(res.statusCode).toBe(405)
    expect(res.body).toBeTruthy()
  })

  it('Unauthenticated GET request. The status should be 401 with a message.', async () => {
    const res = await request(routeTester)
      .get('/projects/')
    expect(res.statusCode).toBe(401)
    expect(res.body).toBeTruthy()
  })

  it('Authenticated GET request to /projects/. The status should be 200.', async () => {
    const res = await request(routeTester)
      .get('/projects/')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBe(true)
  })

  // Testing various queries
  it('Authenticated GET to /projects?hasRoles=ALL. The status should be 200. with an array in the body', async () => {
    const res = await request(routeTester)
      .get('/projects?hasRoles=ALL')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('Authenticated GET to /projects?hasRoles=admin. The status should be 200 with an array in the body.', async () => {
    const res = await request(routeTester)
      .get('/projects?hasRoles=admin')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('Authenticated GET to /projects?hasRoles=admin&hasRoles=collaborator. The status should be 200 with an array in the body.', async () => {
    const res = await request(routeTester)
      .get('/projects?hasRoles=admin&hasRoles=collaborator')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('Authenticated GET to /projects?exceptRoles=NONE. The status should be 200 with an array in the body.', async () => {
    const res = await request(routeTester)
      .get('/projects?exceptRoles=NONE')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('Authenticated GET to /projects?exceptRoles=admin. The status should be 200 with an array in the body.', async () => {
    const res = await request(routeTester)
      .get('/projects?exceptRoles=admin')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('Authenticated GET to /projects?exceptRoles=admin&exceptRoles=collaborator. The status should be 200 with an array in the body.', async () => {
    const res = await request(routeTester)
      .get('/projects?exceptRoles=admin&exceptRoles=collaborator')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('Authenticated GET to /projects?createdBefore=NOW. The status should be 200 with an array in the body.', async () => {
    const res = await request(routeTester)
      .get('/projects?createdBefore=NOW')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('Authenticated GET to /projects?createdBefore=1755500000000. The status should be 200 with an array in the body.', async () => {
    const res = await request(routeTester)
      .get('/projects?createdBefore=1755500000000')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBe(true)
  })
  
  it('Authenticated GET to /projects?createdBefore=1000. The status should be 200 with an empty array in the body.', async () => {
    const res = await request(routeTester)
      .get('/projects?createdBefore=1000')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBe(0)
  })

  it('Authenticated GET to /projects?modifiedBefore=NOW. The status should be 200 with an array in the body.', async () => {
    const res = await request(routeTester)
      .get('/projects?modifiedBefore=NOW')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('Authenticated GET to /projects?modifiedBefore=1755500000000. The status should be 200 with an array in the body.', async () => {
    const res = await request(routeTester)
      .get('/projects?modifiedBefore=1755500000000')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBe(true)
  })
  
  it('Authenticated GET to /projects?modifiedBefore=1000. The status should be 200 with an empty array in the body.', async () => {
    const res = await request(routeTester)
      .get('/projects?modifiedBefore=1000')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBe(0)
  })
  
  it('Authenticated GET to /projects?createdAfter=1000. The status should be 200 with an array in the body.', async () => {
    const res = await request(routeTester)
      .get('/projects?createdAfter=1000')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBe(true)
  })
  
  it('Authenticated GET to /projects?modifedAfter=1000. The status should be 200 with an array in the body.', async () => {
    const res = await request(routeTester)
      .get('/projects?modifedAfter=1000')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBe(true)
  })
  
  it('Authenticated GET to /projects?fields=id&fields=title. The status should be 200 with an array in the body, with each object having only the specified fields.', async () => {
    const res = await request(routeTester)
      .get('/projects?fields=id&fields=title')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.every(project => JSON.stringify(Object.keys(project)) === '["id", "title"]'))
  })
  
  // TODO: reenable once we have fully implemented the fields parameter, and maybe add more tests for it
  /*
  it('Authenticated GET to /projects?fields=id. The status should be 200 with an array in the body, with each object having only the specified fields.', async () => {
    const res = await request(routeTester)
      .get('/projects?fields=id')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.every(project => JSON.stringify(Object.keys(project)) === '["id", "title"]'))
  })
  */

  // TODO: Update test to check for publicity (once query is properly implemented)
  it('Authenticated GET to /projects?isPublic=true. The status should be 200 with an array in the body.', async () => {
    const res = await request(routeTester)
      .get('/projects?isPublic=true')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBe(true)
  })

  // TODO: Update test to check for publicity (once query is properly implemented)
  it('Authenticated GET to /projects?isPublic=false. The status should be 200 with an array in the body.', async () => {
    const res = await request(routeTester)
      .get('/projects?isPublic=false')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBe(true)
  })

  // TODO: Update test to check for collaborators (once query is properly implemented)
  it('Authenticated GET to /projects?hasCollaborators=true. The status should be 200 with an array in the body.', async () => {
    const res = await request(routeTester)
      .get('/projects?hasCollaborators=true')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBe(true)
  })

  // TODO: Update test to check for no collaborators (once query is properly implemented)
  it('Authenticated GET to /projects?hasCollaborators=false. The status should be 200 with an array in the body.', async () => {
    const res = await request(routeTester)
      .get('/projects?hasCollaborators=false')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBe(true)
  })

  // TODO: add test for `tags` query once implemented
 
  it('Authenticated GET to /projects?count=true. The status should be 200 with a number in the body.', async () => {
    const res = await request(routeTester)
      .get('/projects?count=true')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(parseInt(res.text)).not.toBe(NaN)
  })

  it('Authenticated GET to /projects?count=false. The status should be 200 with an array in the body.', async () => {
    const res = await request(routeTester)
      .get('/projects?count=true')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(parseInt(res.text)).not.toBe(NaN)
  })
   
  it('Authenticated GET to /projects?createdBefore=1000&count=true. The status should be 200 with 0 in the body.', async () => {
    const res = await request(routeTester)
      .get('/projects?createdBefore=1000&count=true')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(parseInt(res.text)).toBe(0)
  })
   
  it('Authenticated GET to /projects?modifiedBefore=1000&count=true. The status should be 200 with 0 in the body.', async () => {
    const res = await request(routeTester)
      .get('/projects?modifiedBefore=1000&count=true')
      .auth(process.env.TEST_TOKEN, {type: "bearer"})
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(parseInt(res.text)).toBe(0)
  })
  
})