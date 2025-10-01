import request from 'supertest'
import app from '../../app.js'
import Line from '../../classes/Line/Line.js'
import { jest } from '@jest/globals'

jest.mock('../../classes/Line/Line.js', () => {
  const mockLine = jest.fn()
  mockLine.prototype.load = jest.fn()
  mockLine.prototype.save = jest.fn()
  mockLine.prototype.update = jest.fn()
  mockLine.prototype.updateText = jest.fn()
  mockLine.prototype.updateBounds = jest.fn()
  return { Line: mockLine }
})

// mockResolved is all weird.
describe.skip('lineRouter API tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('GET /project/:pid/page/:pid/line/:line should load a line', async () => {
    Line.prototype.constructor.mockResolvedValue({
      asJSON: () => ({ id: '123', body: 'Sample Line', target: 'https://example.com?xywh=10,10,100,100' })
    })

    const response = await request(app).get('/project/1/page/1/line/123')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ id: '123', body: 'Sample Line', target: 'https://example.com?xywh=10,10,100,100' })
  })

  it('POST /project/:pid/page/:pageid/line/:line should create a line', async () => {
    Line.prototype.save.mockResolvedValue({
      asJSON: () => ({ id: '123', body: 'New Line', target: 'https://example.com?xywh=10,10,100,100' })
    })

    const response = await request(app)
      .post('/project/1/page/1/line/123')
      .send({ body: 'New Line', target: 'https://example.com?xywh=10,10,100,100' })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ id: '123', body: 'New Line', target: 'https://example.com?xywh=10,10,100,100' })
  })

  it('should detect suspicious content in array of annotations', async () => {
    const annotations = [
      {
        id: 'anno-1',
        body: {'value': 'This is fine'},
        target: 'canvas#xywh=0,0,100,100'
      },
      {
        id: 'anno-2',
        body: {'value': '<script>alert("bad")</script>'},
        target: 'canvas#xywh=0,100,100,100'
      }
    ]

    const response = await request(app)
      .post('/project/1/page/1/line/')
      .send(annotations)

    expect(response.status).toBe(400)
  })

  it('PUT /project/:pid/page/:pid/line/:line should update a line', async () => {
    Line.prototype.update.mockResolvedValue({
      asJSON: () => ({ id: '123', body: 'Updated Line', target: 'https://example.com?xywh=10,10,100,100' })
    })

    const response = await request(app)
      .put('/project/1/page/1/line/123')
      .send({ body: 'Updated Line', target: 'https://example.com?xywh=10,10,100,100' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ id: '123', body: 'Updated Line', target: 'https://example.com?xywh=10,10,100,100' })
  })

  it('PUT /project/:pid/page/:pageid/line/:line should reject suspicious content', async () => {
    const suspiciousUpdate = {
      id: 'anno-1',
      body: { value: '<script>alert("bad")</script>' },
      target: 'canvas#xywh=0,0,100,100'
    }

    const response = await request(app)
      .put('/project/1/page/1/line/123')
      .send(suspiciousUpdate)

    expect(response.status).toBe(400)
  })

  it('PATCH /project/:pid/page/:pid/line/:line/text should update line text', async () => {
    Line.prototype.updateText.mockResolvedValue({
      asJSON: () => ({ id: '123', body: 'Updated Text', target: 'https://example.com?xywh=10,10,100,100' })
    })

    const response = await request(app)
      .patch('/project/1/page/1/line/123/text')
      .send({ body: 'Updated Text' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ id: '123', body: 'Updated Text', target: 'https://example.com?xywh=10,10,100,100' })
  })

  it('PATCH /project/:pid/page/:pid/line/:line/bounds should update line bounds', async () => {
    Line.prototype.updateBounds.mockResolvedValue({
      asJSON: () => ({ id: '123', body: 'Sample Line', target: 'https://example.com?xywh=20,20,200,200' })
    })

    const response = await request(app)
      .patch('/project/1/page/1/line/123/bounds')
      .send({ x: 20, y: 20, w: 200, h: 200 })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ id: '123', body: 'Sample Line', target: 'https://example.com?xywh=20,20,200,200' })
  })
})
