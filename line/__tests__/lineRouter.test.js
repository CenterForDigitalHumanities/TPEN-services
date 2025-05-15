import request from 'supertest'
import app from '../../app.js'
import { Line } from '../../classes/Line/Line.js'
import { test } from 'node:test'
import assert from 'node:assert'

class MockLine {
  constructor() {}
  load() {}
  save() {}
  update() {}
  updateText() {}
  updateBounds() {}
}

test('lineRouter API tests', async (t) => {
  t.beforeEach(() => {
    // Clear any manual stubs or state if necessary
  })

  await t.test('GET /project/:pid/page/:pid/line/:line should load a line', async () => {
    Line.prototype.constructor = function () {
      return {
        asJSON: () => ({ id: '123', body: 'Sample Line', target: 'https://example.com?xywh=10,10,100,100' })
      }
    }

    const response = await request(app).get('/project/1/page/1/line/123')

    assert.strictEqual(response.status, 200)
    assert.deepStrictEqual(response.body, { id: '123', body: 'Sample Line', target: 'https://example.com?xywh=10,10,100,100' })
  })

  await t.test('POST /project/:pid/page/:pid/line/:line should create a line', async () => {
    Line.prototype.save = function () {
      return {
        asJSON: () => ({ id: '123', body: 'New Line', target: 'https://example.com?xywh=10,10,100,100' })
      }
    }

    const response = await request(app)
      .post('/project/1/page/1/line/123')
      .send({ body: 'New Line', target: 'https://example.com?xywh=10,10,100,100' })

    assert.strictEqual(response.status, 201)
    assert.deepStrictEqual(response.body, { id: '123', body: 'New Line', target: 'https://example.com?xywh=10,10,100,100' })
  })

  await t.test('PUT /project/:pid/page/:pid/line/:line should update a line', async () => {
    Line.prototype.update = function () {
      return {
        asJSON: () => ({ id: '123', body: 'Updated Line', target: 'https://example.com?xywh=10,10,100,100' })
      }
    }

    const response = await request(app)
      .put('/project/1/page/1/line/123')
      .send({ body: 'Updated Line', target: 'https://example.com?xywh=10,10,100,100' })

    assert.strictEqual(response.status, 200)
    assert.deepStrictEqual(response.body, { id: '123', body: 'Updated Line', target: 'https://example.com?xywh=10,10,100,100' })
  })

  await t.test('PATCH /project/:pid/page/:pid/line/:line/text should update line text', async () => {
    Line.prototype.updateText = function () {
      return {
        asJSON: () => ({ id: '123', body: 'Updated Text', target: 'https://example.com?xywh=10,10,100,100' })
      }
    }

    const response = await request(app)
      .patch('/project/1/page/1/line/123/text')
      .send({ body: 'Updated Text' })

    assert.strictEqual(response.status, 200)
    assert.deepStrictEqual(response.body, { id: '123', body: 'Updated Text', target: 'https://example.com?xywh=10,10,100,100' })
  })

  await t.test('PATCH /project/:pid/page/:pid/line/:line/bounds should update line bounds', async () => {
    Line.prototype.updateBounds = function () {
      return {
        asJSON: () => ({ id: '123', body: 'Sample Line', target: 'https://example.com?xywh=20,20,200,200' })
      }
    }

    const response = await request(app)
      .patch('/project/1/page/1/line/123/bounds')
      .send({ x: 20, y: 20, w: 200, h: 200 })

    assert.strictEqual(response.status, 200)
    assert.deepStrictEqual(response.body, { id: '123', body: 'Sample Line', target: 'https://example.com?xywh=20,20,200,200' })
  })
})
