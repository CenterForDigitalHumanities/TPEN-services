import express from "express"
import request from "supertest"
import auth0Middleware from "../../utilities/auth.mjs"

const app = express()

// Use the auth0Middleware in the routeTester app
app.use(auth0Middleware())

//Test for the auth0Middleware function
describe("auth0Middleware #auth_test", () => {
  it("should return 401 Unauthorized without valid token", async () => {
    const res = await request(app).get("/protected-route")

    expect(res.status).toBe(401)
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
    const mockNext = jest.fn()

    const [verifier, setUser] = auth0Middleware()
    await verifier(mockRequest, mockResponse, mockNext)
    setUser(mockRequest, mockResponse, mockNext)

    expect(mockRequest.user).toEqual({
      sub: "user123",
      roles: ["admin", "user"]
    })

    expect(mockNext).toHaveBeenCalled()
  })
})
