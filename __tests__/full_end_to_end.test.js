import app from '../app.js'
import dbDriver from '../database/driver.js'
const db = new dbDriver('mongo')
import request from 'supertest'
import { test, describe, after } from 'node:test'
import assert from 'node:assert'

describe('App index test. #e2e', () => {
  test('responds to / with a 200 status and and the index.html page.', async () => {
    const res = await request(app).get('/')
    assert.strictEqual(res.statusCode, 200)
    assert.match(res.type, /html/)
  })
})

describe('Invalid site path test. #e2e', () => {
  test('returns a graceful 404', async () => {
    const res = await request(app).get('/potato/')
    assert.strictEqual(res.statusCode, 404)
  })
})

describe('Endpoint tests. #e2e', () => {
  test('This is always going to pass because it is a good stub.', async () => {
    assert.ok(true)
  })
})

after(async () => {
  // Attempt to close any global DB or API connections if they exist
  if (globalThis.mongoClient?.close) {
    await globalThis.mongoClient.close()
  }
  if (globalThis.db?.close) {
    await globalThis.db.close()
  }
  if (db?.close) await db.close()
  // Attempt to close MariaDB connection if it exists
  if (globalThis.mariaClient?.close) {
    await globalThis.mariaClient.close()
  }
  if (globalThis.mariaDb?.close) {
    await globalThis.mariaDb.close()
  }
  // Add similar cleanup for any other persistent connections
})
