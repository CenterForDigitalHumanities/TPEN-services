import assert from "assert"
import request from "supertest"
import express from "express"
import User from "../User.js"

import privateProfileRouter from "../../../userProfile/privateProfile.js"
import mainApp from "../../../app.js"

const app = express()

let token = process.env.TEST_TOKEN

app.use("/my", privateProfileRouter)

describe("GET /my/profile #user_class", () => {
  const userStub = {
    _id: "123456",
    userData: {name: "VOO"}
  }

  beforeAll(() => {
    User.prototype.getSelf = function() {
      return Promise.resolve(userStub)
    }
  })

  afterAll(() => {
    User.prototype.getSelf = undefined
  })

  it.skip("should return user profile data", async () => {
    const response = await request(app)
      .get("/my/profile")
      .set("Authorization", `Bearer ${token}`)
    assert.strictEqual(response.status, 200)
    assert(response.body.hasOwnProperty("userData"))
    assert.deepStrictEqual(response.body.userData, {name: "VOO"})
  })

  it("should return 401 if user is not authenticated", async () => {
    const appWithoutAuth = express()
    appWithoutAuth.use("/my", privateProfileRouter)
    const response = await request(appWithoutAuth).get("/my/profile")
    assert.strictEqual(response.status, 401)
  })
})

describe("GET /my/projects #user_class", () => {
  const projectsStub = [
    {
      _id: "project.id",
      "@type": "Project",
      creator: "user.agent",
      groups: {
        members: [{agent: "user.agent", _id: "user._id"}]
      }
    }
  ]

  beforeAll(() => {
    User.prototype.getProjects = function() {
      return Promise.resolve(projectsStub)
    }
  })

  afterAll(() => {
    User.prototype.getProjects = undefined
  })

  it.skip("should return user projects as an array", async () => {
    const response = await request(app)
      .get("/my/projects")
      .set("Authorization", `Bearer ${token}`)
    assert.strictEqual(response.status, 200)
    assert(Array.isArray(response.body))

    if (Array.isArray(response.body)) {
      for (const obj of response.body) {
        assert(obj.hasOwnProperty("@type"))
        assert.strictEqual(obj["@type"], "Project")
      }
    }
  })

  it("should return 401 if user is not authenticated", async () => {
    const appWithoutAuth = express()
    appWithoutAuth.use("/my", privateProfileRouter)
    const response = await request(appWithoutAuth).get("/my/profile")
    assert.strictEqual(response.status, 401)
  })
})
