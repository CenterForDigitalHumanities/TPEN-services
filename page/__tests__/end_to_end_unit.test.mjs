import pageRouter from '../index.mjs'
import express from 'express'
import request from 'supertest'

const routeTester = new express()
routeTester.use("/page", pageRouter)

describe('page endpoint end to end unit test (spinning up the endpoint and using it). #end2end_unit', () => {

  it('POST instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .post('/page/')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('PUT instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .put('/page/')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('PATCH instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .patch('/page/')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('Call to /page without a TPEN3 page ID.  The status should be 400 with a message.', async () => {
    const res = await request(routeTester)
      .get('/page/')
      expect(res.statusCode).toBe(400)
      expect(res.body).toBeTruthy()
  })

  it('Call to /page with a TPEN3 page ID that does not exist.  The status should be 404 with a message.', async () => {
    request(routeTester)
      .get('/page/0001')
      expect(404)
  })

  it('Call to /page with a TPEN3 page ID that does  exist.  The status should be 200 with a JSON page in the body.', async () => {
    const res = await request(routeTester)
      .get('/page/123')
      let json = res.body
      try{
        json = JSON.parse(JSON.stringify(json))
      }
      catch(err){
        json = null
      }
      expect(json).not.toBe(null)
  })
  it('should add a line to the end of the annotation page', async () => {
    request(routeTester)
      .post(`/page/6627fc3d5cc3848690279f7c/appendLine`)
      .send({
        "@context": "http://www.w3.org/ns/anno.jsonld",
        "@id": "https://devstore.rerum.io/v1/id/662801cbe8afc731e3b58e52",
        "creator": "thehabes",
        "type": "Annotation",
        "motivation": "supplementing",
        "body": {
          "type": "TextualBody",
          "value": "hello world",
          "format": "text/plain",
          "language": "la"
        },
        "target": "https://manifest/canvas/4#xywh=10,20,145,55"
      })

    expect(200)

  })

  it('should add a line to the beginning of the annotation page', async () => {
    request(routeTester)
      .post(`/page/6627fc3d5cc3848690279f7c/prependLine`)
      .send({
        "@context": "http://www.w3.org/ns/anno.jsonld",
        "@id": "https://devstore.rerum.io/v1/id/662801cbe8afc731e3b58e52",
        "creator": "thehabes",
        "type": "Annotation",
        "motivation": "supplementing",
        "body": {
          "type": "TextualBody",
          "value": "hello world",
          "format": "text/plain",
          "language": "la"
        },
        "target": "https://manifest/canvas/4#xywh=10,20,145,55"
      })

    expect(200)
  })
})
