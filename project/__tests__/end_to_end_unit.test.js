import projectRouter from "../index.js"
import express from "express"
import request from "supertest"
import app from "../../app.js"
import ProjectFactory from "../../classes/Project/ProjectFactory.js"
import Project from "../../classes/Project/Project.js"
import DatabaseController from "../../database/mongo/controller.js"
import { test } from "node:test"
import assert from "assert"

const routeTester = new express()
let token = process.env.TEST_TOKEN
routeTester.use("/project", projectRouter)

test("Project endpoint end to end unit test (spinning up the endpoint and using it). #end2end_unit #projectTest", async (t) => {
  await t.test("Call to /project with a non-hexadecimal project ID. The status should be 400 with a message.", async () => {
    const res = await request(routeTester)
      .get("/project/zzz")
      .set("Authorization", `Bearer ${token}`)
    assert.strictEqual(res.statusCode, 400)
    assert.ok(res.body)
  })

  await t.test("Call to /project with a TPEN3 project ID that does not exist. The status should be 404 with a message.", async () => {
    const res = await request(routeTester)
      .get("/project/0001")
      .set("Authorization", `Bearer ${token}`)
    assert.strictEqual(res.statusCode, 404)
    assert.ok(res.body)
  })

  await t.test("Call to /project with a TPEN3 project ID that does exist. The status should be 200 with a JSON Project in the body.", async () => {
    const res = await request(routeTester)
      .get("/project/6602dd2314cd575343f513ba")
      .set("Authorization", `Bearer ${token}`)
    assert.strictEqual(res.statusCode, 200)
    assert.ok(res.body)
  })
})

test("Project endpoint end to end unit test to /project/create #end2end_unit", async (t) => {
  await t.test("GET instead of POST. The status should be 404 with a message.", async () => {
    const res = await request(routeTester)
      .get("/project/create")
      .set("Authorization", `Bearer ${token}`)
    assert.strictEqual(res.statusCode, 405)
    assert.ok(res.body)
  })

  await t.test("PUT instead of POST. The status should be 404 with a message.", async () => {
    const res = await request(routeTester).put("/project/create")
    assert.strictEqual(res.statusCode, 405)
    assert.ok(res.body)
  })

  await t.test("PATCH instead of POST. The status should be 404 with a message.", async () => {
    const res = await request(routeTester).patch("/project/create")
    assert.strictEqual(res.statusCode, 405)
    assert.ok(res.body)
  })

  await t.test("should create a project and respond with status 201 if the user is authenticated and valid data is provided", async () => {
    const mockProject = { name: "New Project" }
    const mockCreatedProject = {
      ...mockProject,
      _id: "newProjectId",
      creator: "agentId"
    }

    Project.prototype.create = async function () {
      return mockCreatedProject
    }

    const response = await request(app)
      .post("/project/create")
      .set("Authorization", `Bearer ${token}`)
      .send(mockProject)

    assert.strictEqual(response.status, 201)
    assert.strictEqual(response.headers.location, mockCreatedProject._id)
    assert.deepStrictEqual(response.body, mockCreatedProject)
  })
})

test("POST /project/import?createFrom=URL #importTests", async (t) => {
  await t.test("should import project successfully", async () => {
    const manifestURL = "https://t-pen.org/TPEN/project/4080"
    const mockProject = {
      label: "Test Project",
      "@type": "@Project",
      metadata: [{ label: "title", value: "Lorem Ipsum" }],
      " @context": "http://t-pen.org/3/context.json",
      layers: []
    }

    ProjectFactory.fromManifestURL = async function () {
      return mockProject
    }

    const response = await request(app)
      .post(`/project/import?createFrom=URL`)
      .set("Authorization", `Bearer ${token}`)
      .send({ url: manifestURL })
    assert.strictEqual(response.status, 201)
    assert.deepStrictEqual(response.body, mockProject)
  })

  await t.test("should return 400 if createFrom is not provided #importTests", async () => {
    const response = await request(app)
      .post("/project/import")
      .set("Authorization", `Bearer ${token}`)
      .send({})
    assert.strictEqual(response.status, 400)
    assert.strictEqual(
      response.body.message,
      "Query string 'createFrom' is required, specify manifest source as 'URL' or 'DOC' "
    )
  })

  await t.test("should return 404 if manifest URL is not provided when createFrom=url", async () => {
    const response = await request(app)
      .post("/project/import?createFrom=url")
      .set("Authorization", `Bearer ${token}`)
      .send({})
    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.message, "Manifest URL is required for import")
  })

  await t.test("should handle unknown server errors", async () => {
    const manifestURL = "https://t-pen.org/TPEN/project/4080"

    ProjectFactory.fromManifestURL = async function () {
      throw new Error("Import error")
    }

    const response = await request(app)
      .post(`/project/import?createFrom=url`)
      .set("Authorization", `Bearer ${token}`)
      .send({ url: manifestURL })
    assert.strictEqual(response.status, 500)
    assert.ok(response.body.message)
  })
})

// Invite member test cases
test("POST /project/:id/invite-member ", async (t) => {
  await t.test("should invite a member successfully when the user has permission", async () => {
    const projectId = "6602dd2314cd575343f513ba"
    const mockResponse = { success: true, message: "Member invited" }

    Project.prototype.addMember = async function () {
      return mockResponse
    }

    const response = await request(app)
      .post(`/project/${projectId}/invite-member`)
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "newuser@example.com", roles: ["CONTRIBUTOR"] })

    assert.strictEqual(response.status, 200)
    assert.deepStrictEqual(response.body, mockResponse)
  })

  await t.test("should return 400 if email is missing", async () => {
    const projectId = "6602dd2314cd575343f513ba"

    const response = await request(app)
      .post(`/project/${projectId}/invite-member`)
      .set("Authorization", `Bearer ${token}`)
      .send({ roles: ["CONTRIBUTOR"] })

    assert.strictEqual(response.status, 400)
    assert.strictEqual(response.body.message, "Invitee's email is required")
  })

  await t.test("should return 401 if the user is unauthorized", async () => {
    const projectId = "6602dd2314cd575343f513ba"

    const response = await request(app)
      .post(`/project/${projectId}/invite-member`)
      .send({ email: "newuser@example.com", roles: ["CONTRIBUTOR"] })

    assert.strictEqual(response.status, 401)
    assert.ok(response.body)
  })
})

// Remove member Test cases
test("POST /project/:id/remove-member ", async (t) => {
  await t.test("should remove a member successfully when the user has permission", async () => {
    const projectId = "6602dd2314cd575343f513ba"
    const mockResponse = { success: true, message: "Member removed" }

    Project.prototype.removeMember = async function () {
      return mockResponse
    }

    const response = await request(app)
      .post(`/project/${projectId}/remove-member`)
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: "userIdToRemove" })

    assert.strictEqual(response.status, 204)
  })

  await t.test("should return 400 if userId is missing", async () => {
    const projectId = "6602dd2314cd575343f513ba"

    const response = await request(app)
      .post(`/project/${projectId}/remove-member`)
      .set("Authorization", `Bearer ${token}`)
      .send({})

    assert.strictEqual(response.status, 400)
    assert.strictEqual(response.body.message, "User ID is required")
  })

  await t.test("should return 401 if the user is unauthorized", async () => {
    const projectId = "6602dd2314cd575343f513ba"

    const response = await request(app)
      .post(`/project/${projectId}/remove-member`)
      .send({ userId: "userIdToRemove" })

    assert.strictEqual(response.status, 401)
    assert.ok(response.body)
  })
})

// Layer and Page Test cases
test("GET /project/:projectId/layer/:layerId", async (t) => {
  await t.test("should return a valid AnnotationCollection for a valid layer", async () => {
    const projectId = "6602dd2314cd575343f513ba"
    const layerId = "layer123"

    const res = await request(routeTester)
      .get(`/project/${projectId}/layer/${layerId}`)

    assert.strictEqual(res.statusCode, 200)
    assert.strictEqual(res.body["@context"], "http://www.w3.org/ns/anno.jsonld")
    assert.strictEqual(res.body.type, "AnnotationCollection")
  })

  await t.test("should return 404 if the layer does not exist", async () => {
    const projectId = "6602dd2314cd575343f513ba"
    const layerId = "nonexistentLayer"

    const res = await request(routeTester)
      .get(`/project/${projectId}/layer/${layerId}`)

    assert.strictEqual(res.statusCode, 404)
  })
})

test("GET /project/:projectId/page/:pageId", async (t) => {
  await t.test("should return a valid AnnotationPage for a valid page", async () => {
    const projectId = "6602dd2314cd575343f513ba"
    const pageId = "page123"

    const res = await request(routeTester)
      .get(`/project/${projectId}/page/${pageId}`)

    assert.strictEqual(res.statusCode, 200)
    assert.strictEqual(res.body["@context"], "http://www.w3.org/ns/anno.jsonld")
    assert.strictEqual(res.body.type, "AnnotationPage")
  })

  await t.test("should return 404 if the page does not exist", async () => {
    const projectId = "6602dd2314cd575343f513ba"
    const pageId = "nonexistentPage"

    const res = await request(routeTester)
      .get(`/project/${projectId}/page/${pageId}`)

    assert.strictEqual(res.statusCode, 404)
  })
})
