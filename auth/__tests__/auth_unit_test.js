import express from "express"
import request from "supertest"
import auth0Middleware from "../index.js"
import { ObjectId } from "mongodb"

process.env.AUDIENCE = "provide audience to test"
// this test has a had time reading env directly. add

const app = express()

app.use(auth0Middleware())
const TIME_OUT = process.env.TEST_TIMEOUT ?? 5000

describe("auth0Middleware #auth_test", () => {
  it(
    "should return 400 without Authorization Header",
    async () => {
      const res = await request(app).get("/protected-route")
      expect(res.status).toBe(400)
    },
    TIME_OUT
  )

  it(
    "should return 401 with invalid token from Authorization Header",
    async () => {
      const res = await request(app)
      .get("/protected-route")
      .set("Authorization", `Bearer 123123123123123123123123123`)
      expect(res.status).toBe(401)
    },
    TIME_OUT
  )

  it.skip("should set req.user with payload from auth and call next", async () => {
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

    const [verifier, setUser] = auth0Middleware()

    await verifier(mockRequest, mockResponse, mockNext)
    setUser(mockRequest, mockResponse, mockNext)

    expect(mockRequest.user).toEqual(
      expect.objectContaining({
        sub: "user123",
        roles: expect.arrayContaining(["admin", "user"])
      })
    )

    // expect(mockNext).toHaveBeenCalled()
    expect(mockNextCalled).toBe(true)
  })
})
