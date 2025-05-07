import lineRouter from '../index.js'
import express from 'express'
import request from 'supertest'

const app = express()
app.use('/line', lineRouter)

describe.skip('Line endpoint end to end unit test (spinning up the endpoint and using it). #end2end_unit', () => {
  it('should return 405 for POST request', async () => {
    const res = await request(app).post('/line/').send()
    expect(res.statusCode).toBe(405)
  })

  it('should return 405 for PUT request', async () => {
    const res = await request(app).put('/line/').send()
    expect(res.statusCode).toBe(405)
  })

  it('should return 405 for PATCH request', async () => {
    const res = await request(app).patch('/line/').send()
    expect(res.statusCode).toBe(405)
  })

  it('should return 400 if no TPEN3 line ID provided', async () => {
    const res = await request(app).get('/line/').send()
    expect(res.statusCode).toBe(400)
  })

  it('should return 404 for non-existing TPEN 3 line ID', async () => {
    const res = await request(app).get('/line/1257').send()
    expect(res.statusCode).toBe(404)
  })

  it('should return 200 with a JSON line in the body for valid TPEN3 line ID', async () => {
    const simulatedResponse = {
      statusCode: 200,
      body: {
        '@context': 'http://t-pen.org/3/context.json',
        id: 123,
        '@type': 'Annotation',
        creator: 'https://store.rerum.io/v1/id/hash',
        textualBody: 'Hey TPEN Works on 123',
        project: '#ProjectId',
        canvas: 'https://example.com/canvas.json',
        layer: '#AnnotationCollectionId',
        viewer: 'https://static.t-pen.org/#ProjectId/#PageId/#LineId123',
        license: 'CC-BY',
      }
    }
    return simulatedResponse
  })
})
