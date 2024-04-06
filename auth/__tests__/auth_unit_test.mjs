import express from "express"
import request from "supertest" 
import auth0Middleware from "../index.mjs"

process.env.AUDIENCE = "provide audience to test"
// this test has a had time reading env directly. add

const app = express()

app.use(auth0Middleware())

describe("auth0Middleware #auth_test", () => {
  it("should return 401 Unauthorized without valid token", async () => {
    const res = await request(app).get("/protected-route")

    expect(res.status).toBe(401)
  })

  it("No user should be found on req if token is invalid", async () => {
    const res = await request(app).get("/protected-route")
    expect(res.req.user).toBeUndefined()
  })

  it("should set req.user with payload from auth and call next", async () => {
    const mockRequest = {
      auth: {
        payload: {
          sub: "user123",
          roles: ["admin", "user"]
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

    expect(mockRequest.user).toEqual({
      sub: "user123",
      roles: ["admin", "user"]
    })

    // expect(mockNext).toHaveBeenCalled()
    expect(mockNextCalled).toBe(true)
  })
})
