import app from '../app.js'
import express from 'express'
import request from 'supertest'
import { test, describe } from 'node:test'
import assert from 'node:assert'

/**
 * The route uses the json, set, status and location functions on the res object. 
 * type() - Sets the type (content-type) of response
 * status() - Sets the status code of the response
 * send() - Set the text of the response
 * 
 * The test creates a simple mock response object that duplicates what the Express response object would do in the real application.
 */ 
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
