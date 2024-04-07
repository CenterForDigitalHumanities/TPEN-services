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

  it('Call to /project without a TPEN3 project ID.  The status should be 400 with a message.', async () => {
    const res = await request(routeTester)
      .get('/project/')
      expect(res.statusCode).toBe(400)
      expect(res.body).toBeTruthy()
  })

  it('Call to /project with a non-numeric project ID.  The status should be 400 with a message.', async () => {
    const res = await request(routeTester)
      .get('/project/abc')
      expect(res.statusCode).toBe(400)
      expect(res.body).toBeTruthy()
  })

  it('Call to /project with a partially numeric project ID.  The status should be 400 with a message.', async () => {
    const res = await request(routeTester)
      .get('/project/abc123')
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
      .get('/project/7085?text=blob')
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    let bodyString
    try{
      bodyString = JSON.stringify(res.body)
    }
    catch(err){}
    expect(bodyString).not.toBe(null)
  })

  it('Call to /project with valid ID and parameter ?text=layers. The status should be 200 with an array of Layer objects in the body.', async () => {
    const res = await request(routeTester)
      .get('/project/7085?text=layers')
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBeTruthy()
    expect(typeof res.body[0]).toBe('object')
  })

  it('Call to /project with valid ID and parameter ?text=pages. The status should be 200 with body containing an Array of Pages, each with discrete layer as an entry.', async () => {
    const res = await request(routeTester)
      .get('/project/7085?text=pages')
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBeTruthy()
    expect(typeof res.body[0]).toBe('object')
  })

  it('Call to /project with valid ID and parameter ?text=lines. The status should be 200 with body containing an Array of Pages, then Layers with "textContent" above as "lines".', async () => {
    const res = await request(routeTester)
      .get('/project/7085?text=lines')
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(Array.isArray(res.body)).toBeTruthy()
    expect(typeof res.body[0]).toBe('object')
  })

  it('Call to /project with valid ID and parameter ?image=thumb. The status should be 200 with body containing the URL of the default resolution of a thumbnail from the Manifest.', async () => {
    const res = await request(routeTester)
      .get('/project/7085?image=thumb')
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    let bodyURL
    try{
      bodyURL = URL.toString(res.body)
    }catch(err){}
    expect(bodyURL).not.toBe(null)
  })
  
  it('Call to /project with valid ID and parameter ?lookup=manifest. The status should be 200 with body containing the related document or Array of documents, the version allowed without authentication.', async () => {
    const res = await request(routeTester)
      .get('/project/7085?lookup=manifest')
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
  
  it('Call to /project with valid ID and parameter ?view=json. The status should be 200 with a JSON Project in the body.', async () => {
    const res = await request(routeTester)
      .get('/project/7085')
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
      .get('/project/7085?view=xml')
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(typeof res.body).toBe('object')
  })

  it('Call to /project with valid ID and parameter ?view=html. The status should be 200 with an HTML document in the body.', async () => {
    const res = await request(routeTester)
      .get('/project/7085?view=html')
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
    expect(typeof res.body).toBe('object')
  })

  it('Call to /project with valid ID and multiple mutually exclusive query parameters. The status should be 400.', async () => {
    const res = await request(routeTester)
      .get('/project/7085?text=lines&view=html')
    expect(res.statusCode).toBe(400)
  })
  
})