//need to import app for coverage, not for actual testing tho.
import app from '../../app.mjs'

import express from 'express'

// This is specifically the /manifest router
import {default as manifestRouter} from '../index.mjs'

// supertest can call routes
import request from 'supertest'

const routeTester = new express()
routeTester.use("/manifest", manifestRouter)

describe('Manifest endpoint availability tests.', () => {
  it('Missing id number.  The status should be 400 with a message.', async () => {
    const res = await request(routeTester)
      .get('/manifest/')
      expect(res.statusCode).toBe(400)
  })
  it('Wrong request method.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .post('/manifest/')
      expect(res.statusCode).toBe(405)
  })
})
