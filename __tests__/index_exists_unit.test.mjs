//need to import app for coverage, not for actual testing tho.
import app from '../app.mjs'

import express from 'express'

// This is specifically the /manifest router
import {default as indexRouter} from '../index.mjs'

// supertest can call routes
import request from 'supertest'

const routeTester = new express()
routeTester.use("/", indexRouter)

describe('Index routing unit test.', () => {
  it('The status should be 200 and is text.', async () => {
    const res = await request(routeTester)
      .get('/')
      expect(res.statusCode).toBe(200)
      expect(res.text).toBeTruthy()
  })
})