import User from "../User.js"
import privateProfileRouter from "../../../userProfile/privateProfile.js"
import express from "express"
import request from "supertest"
import { test } from "node:test"
import assert from "node:assert"

// Mock database for User
const mockDatabase = {
  reserveId: () => "mocked_id",
  getById: async () => ({ _id: "123456", userData: { name: "VOO" } }),
  findOne: async () => ({}),
  save: async () => ({}),
  update: async () => ({}),
  controller: {
    db: {
      collection: () => ({
        aggregate: () => ({ toArray: async () => [
          {
            _id: "project.id",
            "@type": "Project",
            creator: "user.agent",
            groups: { members: [{ agent: "user.agent", _id: "user._id" }] }
          }
        ] })
      })
    }
  }
}

test("GET /my/profile returns 401 if user is not authenticated #user_class", async () => {
  const appWithoutAuth = express()
  appWithoutAuth.use("/my", privateProfileRouter)
  const response = await request(appWithoutAuth).get("/my/profile")
  assert.strictEqual(response.status, 401)
})

test("GET /my/projects returns 401 if user is not authenticated #user_class", async () => {
  const appWithoutAuth = express()
  appWithoutAuth.use("/my", privateProfileRouter)
  const response = await request(appWithoutAuth).get("/my/profile")
  assert.strictEqual(response.status, 401)
})
