import request from 'supertest'
import express from 'express'
import layerRouter from '../index.js'
import Project from '../../classes/Project/Project.js'
import Layer from '../../classes/Layer/Layer.js'
import { test } from 'node:test'
import assert from 'node:assert'

const app = express()
app.use(express.json())

// Mock authentication middleware to bypass authentication
const mockAuthMiddleware = (req, res, next) => {
  req.user = { id: 'test-user' } // Mock a valid user
  next()
}

app.use('/project/:projectId/layer', mockAuthMiddleware, layerRouter)

// Manual stubs for Project and Layer classes
class MockProject {
  constructor() {
    this.loadProject = async () => ({ layers: [] })
    this.updateLayer = async () => {}
  }
}

class MockLayer {
  static build(projectId, label, canvases) {
    return {
      update: () => {},
      asProjectLayer: () => ({ label, canvases })
    }
  }
}

test('Layer Routes', async (t) => {
  t.test('POST /project/:projectId/layer', async (t) => {
    t.test('should create a new layer and return 201', async () => {
      const mockLayer = { label: 'Layer 1', canvases: ['canvas1', 'canvas2'] }
      const mockProject = new MockProject()

      const res = await request(app)
        .post('/project/123/layer')
        .send(mockLayer)

      assert.strictEqual(res.status, 201)
      assert.deepStrictEqual(res.body, mockLayer)
    })

    t.test('should return 400 for invalid input', async () => {
      const res = await request(app)
        .post('/project/123/layer')
        .send({ label: 'Layer 1' }) // Missing canvases

      assert.strictEqual(res.status, 400)
      assert.strictEqual(res.body.message, 'Invalid layer data. Provide a label and an array of canvas IDs.')
    })
  })

  t.test('PUT /project/:projectId/layer/:layerId', async (t) => {
    t.test('should update an existing layer and return 200', async () => {
      const mockLayer = { label: 'Updated Layer', canvases: ['canvas1', 'canvas2'] }
      const mockProject = new MockProject()
      mockProject.loadProject = async () => ({ layers: [{ id: 'layer1', label: 'Old Layer', canvases: [] }] })

      const res = await request(app)
        .put('/project/123/layer/layer1')
        .set('Authorization', 'token')
        .send(mockLayer)

      assert.strictEqual(res.status, 200)
      assert.strictEqual(res.body.label, 'Updated Layer')
    })

    t.test('should return 404 if layer is not found', async () => {
      const mockProject = new MockProject()
      mockProject.loadProject = async () => ({ layers: [] })

      const res = await request(app)
        .put('/project/123/layer/layer1')
        .send({ label: 'Updated Layer', canvases: ['canvas1'] })

      assert.strictEqual(res.status, 404)
      assert.strictEqual(res.body.message, 'Layer not found in project')
    })
  })
})
