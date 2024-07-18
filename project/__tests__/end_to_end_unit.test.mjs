import projectRouter from "../index.mjs"
import express from "express"
import request from "supertest"
import app from "../../app.mjs"
import {jest} from "@jest/globals"
import ProjectFactory from "../../classes/Project/ProjectFactory.mjs"

const routeTester = new express()
let token = process.env.TEST_TOKEN
routeTester.use("/project", projectRouter)
describe.skip("Project endpoint end to end unit test (spinning up the endpoint and using it). #end2end_unit", () => {
  it("Call to /project with a non-hexadecimal project ID.  The status should be 400 with a message.", async () => {
    const res = await request(routeTester)
      .get("/project/zzz")
      .set("Authorization", `Bearer ${token}`)
    expect(res.statusCode).toBe(400)
    expect(res.body).toBeTruthy()
  })

  it("Call to /project with a TPEN3 project ID that does not exist.  The status should be 404 with a message.", async () => {
    const res = await request(routeTester)
      .get("/project/0001")
      .set("Authorization", `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
  })

  it("Call to /project with a TPEN3 project ID that does  exist.  The status should be 200 with a JSON Project in the body.", async () => {
    const res = await request(routeTester)
      .get("/project/7085")
      .set("Authorization", `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
  })
})

describe.skip("Project endpoint end to end unit test to /project/create #end2end_unit", () => {
  it("GET instead of POST. The status should be 404 with a message.", async () => {
    const res = await request(routeTester)
      .get("/project/create")
      .set("Authorization", `Bearer ${token}`)
    expect(res.statusCode).toBe(405)
    expect(res.body).toBeTruthy()
  })

  it("PUT instead of POST. The status should be 404 with a message.", async () => {
    const res = await request(routeTester).put("/project/create")
    expect(res.statusCode).toBe(405)
    expect(res.body).toBeTruthy()
  })

  it("PATCH instead of POST. The status should be 404 with a message.", async () => {
    const res = await request(routeTester).patch("/project/create")
    expect(res.statusCode).toBe(405)
    expect(res.body).toBeTruthy()
  })

  it("sends request with valid project. The status should be 201", async () => {
    const project = {
      created: Date.now(),
      manifest: "http://example.com/manifest"
    }
    request(routeTester)
      .post("/project/create")
      .set("Authorization", `Bearer ${token}`)
      .send(project)
      .expect(201)
      .expect("_id", expect.any(String))
  })

  it('sends request with missing "created" key. The status should be 400', async () => {
    const project = {
      creator: "test",
      title: "Test Project",
      manifest: "http://example.com/manifest"
    }
    const res = await request(routeTester)
      .post("/project/create")
      .send(project)
      .set("Authorization", `Bearer ${token}`)
    expect(res.statusCode).toBe(400)
    expect(res.body).toBeTruthy()
  })
})

describe.skip("POST /project/import?createFrom=URL #importTests", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("should import project successfully", async () => {
    const manifestURL = "https://t-pen.org/TPEN/project/4080"
    const mockProject = {
      title: "Test Project",
      metadata: [{label: "title", value: "Lorem Ipsum"}],
      " @context": "http://t-pen.org/3/context.json",
      layers: []
    }

    jest.spyOn(ProjectFactory, "fromManifestURL").mockResolvedValue(mockProject)

    const response = await request(app)
      .post(`/project/import?createFrom=URL`)
      .set("Authorization", `Bearer ${token}`)
      .send({url: manifestURL})
    expect(response.status).toBe(201)
    expect(response.body).toEqual(mockProject)
    expect(ProjectFactory.fromManifestURL).toHaveBeenCalled()
  })

  it("should return 400 if createFrom is not provided #importTests", async () => {
    const response = await request(app)
      .post("/project/import")
      .set("Authorization", `Bearer ${token}`)
      .send({})
    expect(response.status).toBe(400)
    expect(response.body.message).toBe(
      "Query string 'createFrom' is required, specify manifest source as 'URL' or 'DOC' "
    )
  })

  it("should return 404 if manifest URL is not provided when createFrom=url", async () => {
    const response = await request(app)
      .post("/project/import?createFrom=url")
      .set("Authorization", `Bearer ${token}`)
      .send({})
    expect(response.status).toBe(404)
    expect(response.body.message).toBe("Manifest URL is required for import")
  })

  it("should handle unknown server errors", async () => {
    const manifestURL = "https://t-pen.org/TPEN/project/4080"

    jest
      .spyOn(ProjectFactory, "fromManifestURL")
      .mockRejectedValue(new Error("Import error"))

    const response = await request(app)
      .post(`/project/import?createFrom=url`)
      .set("Authorization", `Bearer ${token}`)
      .send({url: manifestURL})
    expect(response.status).toBe(500)
    expect(response.body.message).toBeTruthy()
  })
})
