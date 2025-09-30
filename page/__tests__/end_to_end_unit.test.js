import pageRouter from '../index.js'
import express from 'express'
import request from 'supertest'

const routeTester = new express()
routeTester.use("/", pageRouter)

describe.skip('page endpoint end to end unit test (spinning up the endpoint and using it). #end2end_unit', () => {

  it('POST instead of GET. That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .post('/dummyId')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('PUT unauthed. That status should be 401 with a message.', async () => {
    const res = await request(routeTester)
      .put('/dummyId')
      expect(res.statusCode).toBe(401)
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
  it('Call to /page with a TPEN3 page ID that does not exist. The status should be 404 with a message.', async () => {
    const res = await request(routeTester)
      .get('/0001')
      expect(res.statusCode).toBe(404)
      expect(res.body).toBeTruthy()
  })

  it('Call to /page with a TPEN3 page ID that does exist. The status should be 200 with a JSON page in the body.', async () => {
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

  it('should reject suspicious label in request body', async () => {
    const suspiciousPage = 
    { 
      label: "while(true) return true",
      items: [
        {
          "type":"Annotation", 
          "body": {
            "type": "TextualBody",
            "value": "OK",
            "format": "text/plain"
          }
        }
      ]
    }

    const res = await request(app)
      .put('/project/123/layer/layer1/page/page1')
      .send(suspiciousPage)

    expect(res.status).toBe(400)
  })

  it('should reject suspicious content in items array', async () => {
    const suspiciousPage = 
    { 
      label: "OK",
      items: [
        {
          "type":"Annotation", 
          "body": {
            "type": "TextualBody",
            "value": "while(true) return true",
            "format": "text/plain"
          }
        }
      ]
    }
    const res = await request(app)
      .put('/project/123/layer/layer1/page/page1')
      .send(suspiciousPage)

    expect(res.status).toBe(400)
  })

})
