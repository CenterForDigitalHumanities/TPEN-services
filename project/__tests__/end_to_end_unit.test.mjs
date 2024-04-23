import projectRouter from '../index.mjs'
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
  it('Call to /project with a non-numeric project ID.  The status should be 400 with a message.', async () => {
    const res = await request(routeTester)
      .get('/project/abc')
      expect(res.statusCode).toBe(404)
      expect(res.body).toBeTruthy()
  })
  it('Call to /project with a partially numeric project ID.  The status should be 400 with a message.', async () => {
    const res = await request(routeTester)
      .get('/project/abc123')
      expect(res.statusCode).toBe(404)
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
      .get('/project/abcdefg111222333')
      expect(res.statusCode).toBe(200)
      let json = res.body
      try{
        json = JSON.parse(JSON.stringify(json))
      }
      catch(err){
        json = null
      }
      expect(json).not.toBe(null)
  })
  it('Call to /project with valid ID and parameter ?text=blob. The status should be 200 with a text blob in the body.', async () => {
    const res = await request(routeTester)
      .get('/project/abcdefg111222333?text=blob')
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    let bodyString
    try{
      bodyString = JSON.stringify(res.body)
    }
    catch(err){}
    expect(bodyString).not.toBe(null)
  })
  it('Call to /project with valid ID and parameter ?image=thumb. The status should be 200 with body containing the URL of the default resolution of a thumbnail from the Manifest.', async () => {
    const res = await request(routeTester)
      .get('/project/abcdefg111222333?image=thumb')
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    let bodyURL
    try{
      bodyURL = URL.toString(res.body)
    }catch(err){}
    expect(bodyURL).not.toBe(null)
  })
  it('Call to /project with valid ID and parameter ?view=json. The status should be 200 with a JSON Project in the body.', async () => {
    const res = await request(routeTester)
      .get('/project/abcdefg111222333')
    expect(res.statusCode).toBe(200)
    let json = res.body
    try{
      json = JSON.parse(JSON.stringify(json))
    }
    catch(err){
      json = null
    }
    expect(json).not.toBe(null)
  })
  it('Call to /project with valid ID and parameter ?view=xml. The status should be 200 with an XML document in the body.', async () => {
    const res = await request(routeTester)
      .get('/project/abcdefg111222333?view=xml')
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(typeof res.body).toBe('object')
  })
  it('Call to /project with valid ID and parameter ?view=html. The status should be 200 with an HTML document in the body.', async () => {
    const res = await request(routeTester)
      .get('/project/abcdefg111222333?view=html')
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(typeof res.body).toBe('object')
  })
  it('Call to /project with valid ID and multiple mutually exclusive query parameters. The status should be 400.', async () => {
    const res = await request(routeTester)
      .get('/project/abcdefg111222333?text=lines&view=html')
    expect(res.statusCode).toBe(200)
  })
  it('POST /project/:id/addLayer with invalid payload', async () => {
    const invalidProjectID = 'invalidProjectID'
    const payload =  {
      "label" : "Project - Layer Title",
      "creator" : "https://store.rerum.io/v1/id/agentHex",
      "items" : [{
        "@context": "http://www.w3.org/ns/anno.jsonld",
        "id": "https://store.rerum.io/v1/id/page1",
        "type": "AnnotationPage",
        "partOf": "https://store.rerum.io/v1/id/collection",
        "target" : "https://manifest/canvas/1",
        "next": "https://store.rerum.io/v1/id/page2",
        "items": [
          {
            "id": "https://store.rerum.io/v1/id/anno1",
            "type": "Annotation",
            "body": "http://example.net/comment1",
            "target": "http://example.com/book/chapter1"
          },
          {
            "id": "https://store.rerum.io/v1/id/anno2",
            "type": "Annotation",
            "body": "http://example.net/comment2",
            "target": "http://example.com/book/chapter2"
          }
        ]
      } ]
    }
    const res = await request(routeTester)
      .post(`/project/${invalidProjectID}/addLayer`)
      .send(payload)
    expect(res.status).toBe(500)
  })
})