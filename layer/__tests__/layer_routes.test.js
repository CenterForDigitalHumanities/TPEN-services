import request from 'supertest'
import express from 'express'
import layerRouter from '../index.js'
import Project from '../../classes/Project/Project.js'
import Layer from '../../classes/Layer/Layer.js'
import { jest } from '@jest/globals'

const app = express()
app.use(express.json())

// Mock authentication middleware to bypass authentication
jest.mock('../../auth/index.js', () => jest.fn((req, res, next) => {
  req.user = { id: 'test-user' } // Mock a valid user
  next()
}))

app.use('/project/:projectId/layer', layerRouter)

// Project is not mocking...
jest.mock('../../classes/Project/Project.js', () => {
  const mockProject = jest.fn().mockImplementation(() => ({
    loadProject: jest.fn(),
    updateLayer: jest.fn()
  }))
  return { default: mockProject }
})

jest.mock('../../classes/Layer/Layer.js', () => ({
  Layer: jest.fn()
}))

describe('Layer Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe.skip('POST /project/:projectId/layer', () => {
    it('should create a new layer and return 201', async () => {
      const mockLayer = { label: 'Layer 1', canvases: ['canvas1', 'canvas2'] }
      const mockProject = new Project()
      mockProject.loadProject.mockResolvedValue({ layers: [] })

      Layer.build = jest.fn().mockReturnValue({ update: jest.fn(), asProjectLayer: jest.fn().mockReturnValue(mockLayer) })

      const res = await request(app)
        .post('/project/123/layer')
        .send(mockLayer)

      expect(res.status).toBe(201)
      expect(res.body).toEqual(mockLayer)
      expect(Layer.build).toHaveBeenCalledWith('123', 'Layer 1', ['canvas1', 'canvas2'])
    })

    it('should return 400 for invalid input', async () => {
      const res = await request(app)
        .post('/project/123/layer')
        .send({ label: 'Layer 1' }) // Missing canvases

      expect(res.status).toBe(400)
      expect(res.body.message).toBe('Invalid layer data. Provide a label and an array of canvas IDs.')
    })
  })

  describe.skip('PUT /project/:projectId/layer/:layerId', () => {
    it('should update an existing layer and return 200', async () => {
      const mockLayer = { label: 'Updated Layer', canvases: ['canvas1', 'canvas2'] }
      const mockProject = new Project()
      mockProject.loadProject.mockResolvedValue({ layers: [{ id: 'layer1', label: 'Old Layer', canvases: [] }] })
      mockProject.updateLayer.mockResolvedValue()

      const res = await request(app)
        .put('/project/123/layer/layer1')
        .set('Authorization', 'token')
        .send(mockLayer)

      expect(res.status).toBe(200)
      expect(res.body.label).toBe('Updated Layer')
      expect(mockProject.updateLayer).toHaveBeenCalled()
    })

    it('should return 404 if layer is not found', async () => {
      const mockProject = new Project()
      mockProject.loadProject.mockResolvedValue({ layers: [] })

      const res = await request(app)
        .put('/project/123/layer/layer1')
        .send({ label: 'Updated Layer', canvases: ['canvas1'] })

      expect(res.status).toBe(404)
      expect(res.body.message).toBe('Layer not found in project')
    })
  })
})
