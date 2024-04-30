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

  it('Call to /project with a non-hexadecimal project ID.  The status should be 400 with a message.', async () => {
    const res = await request(routeTester)
      .get('/project/zzz')
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

describe('Project endpoint end to end unit test to /project/create #end2end_unit', () => {
  it('GET instead of POST. The status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .get('/project/create')
    expect(res.statusCode).toBe(405)
    expect(res.body).toBeTruthy()
  })

  it('PUT instead of POST. The status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .put('/project/create')
    expect(res.statusCode).toBe(405)
    expect(res.body).toBeTruthy()
  })

  it('PATCH instead of POST. The status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .patch('/project/create')
    expect(res.statusCode).toBe(405)
    expect(res.body).toBeTruthy()
  })

  it('sends request with valid project. The status should be 201', async () => {
    const project = {
      created: Date.now(),
      manifest: 'http://example.com/manifest'
    }
    request(routeTester)
      .post('/project/create')
      .send(project)
      .expect(201)
      .expect('_id', expect.any(String))
  })

  it('sends request with missing "created" key. The status should be 400', async () => {
    const project = {
      creator: 'test',
      title: 'Test Project',
      manifest: 'http://example.com/manifest',
    }
    const res = await request(routeTester)
      .post('/project/create')
      .send(project)
    expect(res.statusCode).toBe(400)
    expect(res.body).toBeTruthy()
  })

  it('sends request with non-URI "manifest" key. The status should be 400', async () => {
    const project = {
      creator: 'test',
      created: Date.now(),
      title: 'Test Project',
      manifest: 'invalid-url',
    }
    const res = await request(routeTester)
      .post('/project/create')
      .send(project)
    expect(res.statusCode).toBe(400)
    expect(res.body).toBeTruthy()
  })

  it('sends request with non-string "license" key. The status should be 400', async () => {
    const project = {
      created: Date.now(),
      manifest: 'http://example.com/manifest',
      license: 123
    }
    const res = await request(routeTester)
      .post('/project/create')
      .send(project)
    expect(res.statusCode).toBe(400)
    expect(res.body).toBeTruthy()
  })

  it('sends request with non-string "title" key. The status should be 400', async () => {
    const project = {
      created: Date.now(),
      manifest: 'http://example.com/manifest',
      title: 123
    }
    const res = await request(routeTester)
      .post('/project/create')
      .send(project)
    expect(res.statusCode).toBe(400)
    expect(res.body).toBeTruthy()
  })

  it('sends request with non-numeric "created" key. The status should be 400', async () => {
    const project = {
      created: 'invalid-date',
      manifest: 'http://example.com/manifest',
    }
    const res = await request(routeTester)
      .post('/project/create')
      .send(project)
    expect(res.statusCode).toBe(400)
    expect(res.body).toBeTruthy()
  })

  it('sends request with non-array "tools" key. The status should be 400', async () => {
    const project = {
      tools: 'invalid-tools',
      manifest: 'http://example.com/manifest',
    }
    const res = await request(routeTester)
      .post('/project/create')
      .send(project)
    expect(res.statusCode).toBe(400)
    expect(res.body).toBeTruthy()
  })

  it('sends request with "tools" key containing no strings. The status should be 400', async () => {
    const project = {
      tools: [1, 2, 3],
      manifest: 'http://example.com/manifest',
    }
    const res = await request(routeTester)
      .post('/project/create')
      .send(project)
    expect(res.statusCode).toBe(400)
    expect(res.body).toBeTruthy()
  })

  it('sends request with "tools" key partially containing strings. The status should be 400', async () => {
    const project = {
      tools: ['1', 2, 3],
      manifest: 'http://example.com/manifest',
    }
    const res = await request(routeTester)
      .post('/project/create')
      .send(project)
    expect(res.statusCode).toBe(400)
    expect(res.body).toBeTruthy()
  })

  it('sends request with non-string "@type" key. The status should be 400', async () => {
    const project = {
      "@type": 123,
      manifest: 'http://example.com/manifest',
    }
    const res = await request(routeTester)
      .post('/project/create')
      .send(project)
    expect(res.statusCode).toBe(400)
    expect(res.body).toBeTruthy()
  })

  it('sends request with "@type" set to something other than "Project". The status should be 400', async () => {
    const project = {
      "@type": "Manifest",
      manifest: 'http://example.com/manifest',
    }
    const res = await request(routeTester)
      .post('/project/create')
      .send(project)
    expect(res.statusCode).toBe(400)
    expect(res.body).toBeTruthy()
  })
})