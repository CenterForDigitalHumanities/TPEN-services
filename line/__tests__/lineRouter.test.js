import request from 'supertest'
import app from '../../app.js'
import { Line } from '../../classes/Line/Line.js'
import { jest } from '@jest/globals'

jest.mock('../../classes/Line/Line.js', () => ({
  Line: jest.fn()
}))

describe('lineRouter API tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('GET /project/:pid/page/:pid/line/:line should load a line', async () => {
    Line.mockImplementation(() => ({
      load: jest.fn().mockResolvedValue({ asJSON: () => ({ id: '123', body: 'Sample Line', target: 'https://example.com?xywh=10,10,100,100' }) })
    }))

    const response = await request(app).get('/project/1/page/1/line/123')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ id: '123', body: 'Sample Line', target: 'https://example.com?xywh=10,10,100,100' })
  })

  it('POST /project/:pid/page/:pid/line/:line should create a line', async () => {
    Line.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({ asJSON: () => ({ id: '123', body: 'New Line', target: 'https://example.com?xywh=10,10,100,100' }) })
    }))

    const response = await request(app)
      .post('/project/1/page/1/line/123')
      .send({ body: 'New Line', target: 'https://example.com?xywh=10,10,100,100' })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ id: '123', body: 'New Line', target: 'https://example.com?xywh=10,10,100,100' })
  })

  it('PUT /project/:pid/page/:pid/line/:line should update a line', async () => {
    Line.mockImplementation(() => ({
      update: jest.fn().mockResolvedValue({ asJSON: () => ({ id: '123', body: 'Updated Line', target: 'https://example.com?xywh=10,10,100,100' }) })
    }))

    const response = await request(app)
      .put('/project/1/page/1/line/123')
      .send({ body: 'Updated Line', target: 'https://example.com?xywh=10,10,100,100' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ id: '123', body: 'Updated Line', target: 'https://example.com?xywh=10,10,100,100' })
  })

  it('PATCH /project/:pid/page/:pid/line/:line/text should update line text', async () => {
    Line.mockImplementation(() => ({
      updateText: jest.fn().mockResolvedValue({ asJSON: () => ({ id: '123', body: 'Updated Text', target: 'https://example.com?xywh=10,10,100,100' }) })
    }))

    const response = await request(app)
      .patch('/project/1/page/1/line/123/text')
      .send({ body: 'Updated Text' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ id: '123', body: 'Updated Text', target: 'https://example.com?xywh=10,10,100,100' })
  })

  it('PATCH /project/:pid/page/:pid/line/:line/bounds should update line bounds', async () => {
    Line.mockImplementation(() => ({
      updateBounds: jest.fn().mockResolvedValue({ asJSON: () => ({ id: '123', body: 'Sample Line', target: 'https://example.com?xywh=20,20,200,200' }) })
    }))

    const response = await request(app)
      .patch('/project/1/page/1/line/123/bounds')
      .send({ x: 20, y: 20, w: 200, h: 200 })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ id: '123', body: 'Sample Line', target: 'https://example.com?xywh=20,20,200,200' })
  })
})
