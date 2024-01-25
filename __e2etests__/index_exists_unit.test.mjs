//need to import app for coverage, not for actual testing tho.
import app from '../../app.mjs'

import express from 'express'

// This is specifically the /manifest router
import {default as indexRouter} from '../index.mjs'

// supertest can call routes
import request from 'supertest'

const routeTester = new express()
routeTester.use("/", indexRouter)

describe('Index routing unit test.', () => {
  it('Missing id number.  The status should be 400 with a message.', async () => {
    const res = await request(routeTester)
      .get('/')
      expect(res.statusCode).toBe(200)
      expect(response.body).toMatch("TPEN3 SERVICES BABY!!!")
  })
  it('Wrong request method.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .post('/')
      expect(res.statusCode).toBe(405)
  })
})