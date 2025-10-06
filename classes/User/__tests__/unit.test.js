import {expect, jest} from "@jest/globals"
import request from "supertest"
import express from "express"
import User from "../User.js"

import privateProfileRouter from "../../../userProfile/privateProfile.js"
import mainApp from "../../../app.js"

jest.mock("../User.js")
jest.mock("../../../auth/index.js")

const app = express()

let token = process.env.TEST_TOKEN

// app.use( (req, res, next)=>{
//   req.auth = {
//     payload: {
//       "http://store.rerum.io/agent": "agent_value",
//       _id: "123456"
//     },
//     token:`Bearer ${token}`
//   }
//   req.user = {
//     _id: "123456",
//     username: "exampleUser",
//     profile: { name: "John Doe" }
//   }

//   next()

// })

app.use("/my", privateProfileRouter)

describe.skip("GET /my/profile #user_class", () => {
  it("should return 200", async () => {
    const response = await request(mainApp)
      .get("/my/profile")
      .set("Authorization", `Bearer ${token}`)
    expect(response.status).toBe(200)
  })
})

describe.skip("GET /my/projects #user_class", () => {
  it("should return 200", async () => {
    const response = await request(mainApp)
      .get("/my/projects")
      .set("Authorization", `Bearer ${token}`)
    expect(response.status).toBe(200)
  })
})

describe.skip("GET /my/profile #user_class", () => {
  it("should return 200", async () => {
    const response = await request(app)
      .get("/my/profile")
      .set("Authorization", `Bearer ${token}`)
    expect(response.status).toBe(200)
  })
})

describe.skip("GET /my/projects #user_class", () => {
  it("should return 200", async () => {
    const response = await request(app)
      .get("/my/projects")
      .set("Authorization", `Bearer ${token}`)
    expect(response.status).toBe(200)
  })
})

describe("GET /my/profile #user_class", () => {
  beforeAll(() => {
    jest.spyOn(User.prototype, "getSelf").mockResolvedValue({
      _id: "123456",
      userData: {name: "VOO"}
    })
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it.skip("should return user profile data", async () => {
    const response = await request(app)
      .get("/my/profile")
      .set("Authorization", `Bearer ${token}`)
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty("userData")
    expect(response.body.userData).toEqual({name: "VOO"})
  })

  it("should return 401 if user is not authenticated (no authorization header)", async () => {
    const appWithoutAuth = express()
    appWithoutAuth.use("/my", privateProfileRouter)
    const response = await request(appWithoutAuth).get("/my/profile")
    expect(response.status).toBe(401)
  })

  it("should return 401 if user is not authenticated (invalid authorization header)", async () => {
    const appWithoutAuth = express()
    appWithoutAuth.use("/my", privateProfileRouter)
    const response = await request(appWithoutAuth)
    .get("/my/profile")
    .set("Authorization", `Bearer 123123123123123123123123123`)
    expect(response.status).toBe(401)
  })
})

describe("GET /my/projects #user_class", () => {
  beforeAll(() => {
    jest.spyOn(User.prototype, "getProjects").mockResolvedValue([
      {
        _id: "project.id",
        "@type": "Project",
        creator: "user.agent",
        groups: {
          members: [{agent: "user.agent", _id: "user._id"}]
        }
      }
    ])
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  it.skip("should return user projects as an array", async () => {
    const response = await request(app)
      .get("/my/projects")
      .set("Authorization", `Bearer ${token}`)
    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)

    if (Array.isArray(response.body)) {
      for (const obj of response.body) {
        expect(obj).toHaveProperty("@type", "Project")
      }
    }
  })
  it("should return 401 if user is not authenticated (no authorization header)", async () => {
    const appWithoutAuth = express()
    appWithoutAuth.use("/my", privateProfileRouter)
    const response = await request(appWithoutAuth).get("/my/profile")
    expect(response.status).toBe(401)
  })

  it("should return 401 if user is not authenticated (invalid authorization header)", async () => {
    const appWithoutAuth = express()
    appWithoutAuth.use("/my", privateProfileRouter)
    const response = await request(appWithoutAuth)
      .get("/my/profile")
      .set("Authorization", `Bearer 123123123123123123123123123`)
    expect(response.status).toBe(401)
  })
})
