import userProfileRouter from "../index.js"
import privateUserRouter from "../privateProfile.js"
import mainApp from "../../app.js"
import express from "express"
import request from "supertest"
import app from '../../app.js'
import User from "../../classes/User/User.js"
import { test, describe } from 'node:test'
import assert from 'node:assert'

const routeTester = new express()
const privateRoutesTester = new express()
routeTester.use("/user", userProfileRouter)
privateRoutesTester.use("/my", privateUserRouter)

describe("Test private routes restfulness #user_class", () => {
  test("POST instead of GET. That status should be 405 with a message.", async () => {
    const res = await request(mainApp).post("/my/profile")
    assert.strictEqual(res.statusCode, 405)
    assert.ok(res.body)
  })
})

describe("Unauthourized GETs    #user_class", () => {
  test("/my/profile should return 401", async () => {
    const response = await request(mainApp).get("/my/profile")
    assert.strictEqual(response.status, 401)
    assert.ok(response.body)
  })

  test("/my/project should return 401 #user_class", async () => {
    const response = await request(mainApp).get("/my/projects")
    assert.strictEqual(response.status, 401)
    assert.ok(response.body)
  })
})

describe('userProfile endpoint end to end unit test (spinning up the endpoint and using it). #end2end_unit', () => {

  test('POST instead of GET. That status should be 404 with a message.', async () => {
    const res = await request(routeTester)
      .post('/user/')
    assert.strictEqual(res.statusCode, 404)
    assert.ok(res.body)
  })

  test('PUT instead of GET. That status should be 404 with a message.', async () => {
    const res = await request(routeTester)
      .put('/user/')
    assert.strictEqual(res.statusCode, 404)
    assert.ok(res.body)
  })

  test('PATCH instead of GET. That status should be 404 with a message.', async () => {
    const res = await request(routeTester)
      .patch('/user/')
    assert.strictEqual(res.statusCode, 404)
    assert.ok(res.body)
  })

  test('Call to /user with a TPEN3 user ID that does not exist. The status should be 400 with a message.', async () => {
    const res = await request(routeTester)
      .get('/user/')
    assert.strictEqual(res.statusCode, 400)
    assert.ok(res.body)
  })

  test('Call to /user with a TPEN3 user ID that is  invalid', async () => {
    const res = await request(routeTester)
      .get('/user/kjl')
    assert.strictEqual(res.statusCode, 400)
    assert.ok(res.body)
  })

  test('Call to /user with a TPEN3 user ID that does exist. The status should be 200 with a JSON user profile in the body.', async () => {
    const originalGetPublicInfo = User.prototype.getPublicInfo
    User.prototype.getPublicInfo = async function () {
      return { _id: '123', displayName: 'Test User' }
    }
    const res = await request(routeTester)
      .get('/user/123')
    assert.strictEqual(res.statusCode, 200)
    assert.ok(res.body)
    User.prototype.getPublicInfo = originalGetPublicInfo
  })
})
 
describe('GET /:id route #testThis', () => {
  test('should respond with status 400 if no user ID is provided', async () => {
    const response = await request(app).get('/user/')
    assert.strictEqual(response.status, 400)
    assert.strictEqual(response.body.message, 'No user ID provided')
  })

  test('should respond with status 400 if the provided user ID is invalid', async () => {
    const response = await request(app).get('/user/jkl')
    assert.strictEqual(response.status, 400)
    assert.strictEqual(response.body.message, 'The TPEN3 user ID is invalid')
  })

  test.skip('should respond with status 404 and a message if no user found with provided ID', async () => {
    const originalGetById = User.prototype.getById
    User.prototype.getById = async function () {
      return {}
    }

    const response = await request(app).get('/user/123')
    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.message, "No TPEN3 user with ID '123' found")
    User.prototype.getById = originalGetById
  })
})

