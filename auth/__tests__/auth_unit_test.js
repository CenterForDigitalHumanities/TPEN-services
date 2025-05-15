import express from "express"
import request from "supertest"
import auth0Middleware from "../index.js"
import { ObjectId } from "mongodb"
import { test, describe } from "node:test"
import assert from "node:assert"

process.env.AUDIENCE = "provide audience to test"
// this test has a had time reading env directly. add

const app = express()

app.use(auth0Middleware())
const TIME_OUT = process.env.TEST_TIMEOUT ?? 5000

describe("auth0Middleware #auth_test", () => {
  test(
    "should return 401 Unauthorized without valid token",
    async () => {
      const res = await request(app).get("/protected-route")
      assert.strictEqual(res.status, 401)
    },
    { timeout: TIME_OUT }
  )

  test(
    "No user should be found on req if token is invalid",
    async () => {
      const res = await request(app).get("/protected-route")
      assert.strictEqual(res.req.user, undefined)
    },
    { timeout: TIME_OUT }
  )

  test.skip("should set req.user with payload from auth and call next", async () => {
    const mockRequest = {
      auth: {
        payload: {
          sub: "user123",
          roles: ["admin", "user"],
          "http://store.rerum.io/agent":`test_agent/id/${new ObjectId()}`
        },
        token: process.env.TEST_TOKEN,
        headers: {
          authorization: "Bearer " + process.env.TEST_TOKEN
        }
      }
    }
    const mockResponse = {}
    let mockNextCalled = false
    const mockNext = function () {
      mockNextCalled = true
    }

    // Use different variable names to avoid redeclaration
    const [middlewareVerifier, middlewareSetUser] = auth0Middleware()

    await middlewareVerifier(mockRequest, mockResponse, mockNext)
    middlewareSetUser(mockRequest, mockResponse, mockNext)

    assert.deepStrictEqual(
      mockRequest.user,
      Object.assign({}, mockRequest.auth.payload)
    )
    assert.strictEqual(mockNextCalled, true)
  })
})
