import projectRouter from "../index.mjs"
import express from "express"
import request from "supertest"
import app from "../../app.js"
import {jest} from "@jest/globals"
import ProjectFactory from "../../classes/Project/ProjectFactory.mjs"
import Project from "../../classes/Project/Project.mjs"
import DatabaseController from "../../database/mongo/controller.mjs"

const routeTester = new express()
let token = process.env.TEST_TOKEN
routeTester.use("/project", projectRouter)
describe.skip("Project endpoint end to end unit test (spinning up the endpoint and using it). #end2end_unit #projectTest", () => {
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
    expect(res.statusCode).toBe(404)
    expect(res.body).toBeTruthy()
  })

  it("Call to /project with a TPEN3 project ID that does  exist.  The status should be 200 with a JSON Project in the body.", async () => {
    const res = await request(routeTester)
      .get("/project/6602dd2314cd575343f513ba")
      .set("Authorization", `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
  })
})

describe("Project endpoint end to end unit test to /project/create #end2end_unit", () => {
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

  it.skip("should create a project and respond with status 201 if the user is authenticated and valid data is provided", async () => {
    const mockProject = {name: "New Project"}
    const mockCreatedProject = {
      ...mockProject,
      _id: "newProjectId",
      creator: "agentId"
    }

    jest
      .spyOn(Project.prototype, "create")
      .mockResolvedValueOnce(mockCreatedProject)

    const response = await request(app)
      .post("/project/create")
      .set("Authorization", `Bearer ${token}`)
      .send(mockProject)

    expect(response.status).toBe(201)
    expect(response.headers.location).toBe(mockCreatedProject._id)
    expect(response.body).toEqual(mockCreatedProject)
  })
})

describe.skip("POST /project/import?createFrom=URL #importTests", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("should import project successfully", async () => {
    const manifestURL = "https://t-pen.org/TPEN/project/4080"
    const mockProject = {
      label: "Test Project",
      "@type": "@Project",
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

 
// Invite member test cases
describe.skip("POST /project/:id/invite-member ", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should invite a member successfully when the user has permission", async () => {
    const projectId = "6602dd2314cd575343f513ba";
    const mockResponse = { success: true, message: "Member invited" };

    jest.spyOn(Project.prototype, "addMember").mockResolvedValue(mockResponse);

    const response = await request(app)
      .post(`/project/${projectId}/invite-member`)
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "newuser@example.com", roles: ["CONTRIBUTOR"] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse);
    expect(Project.prototype.addMember).toHaveBeenCalled();
  });

  it("should return 400 if email is missing", async () => {
    const projectId = "6602dd2314cd575343f513ba";

    const response = await request(app)
      .post(`/project/${projectId}/invite-member`)
      .set("Authorization", `Bearer ${token}`)
      .send({ roles: ["CONTRIBUTOR"] });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invitee's email is required");
  });

  it("should return 401 if the user is unauthorized", async () => {
    const projectId = "6602dd2314cd575343f513ba";

    const response = await request(app)
      .post(`/project/${projectId}/invite-member`)
      .send({ email: "newuser@example.com", roles: ["CONTRIBUTOR"] });

    expect(response.status).toBe(401); 
    expect(response.body).toBeTruthy();
  });
});


// Remove member Test cases
describe.skip("POST /project/:id/remove-member ", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should remove a member successfully when the user has permission", async () => {
    const projectId = "6602dd2314cd575343f513ba";
    const mockResponse = { success: true, message: "Member removed" };

    jest.spyOn(Project.prototype, "removeMember").mockResolvedValue(mockResponse);

    const response = await request(app)
      .post(`/project/${projectId}/remove-member`)
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: "userIdToRemove" });

    expect(response.status).toBe(204);
    expect(Project.prototype.removeMember).toHaveBeenCalled();
  });

  it("should return 400 if userId is missing", async () => {
    const projectId = "6602dd2314cd575343f513ba";

    const response = await request(app)
      .post(`/project/${projectId}/remove-member`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("User ID is required");
  });

  it("should return 401 if the user is unauthorized", async () => {
    const projectId = "6602dd2314cd575343f513ba";

    const response = await request(app)
      .post(`/project/${projectId}/remove-member`)
      .send({ userId: "userIdToRemove" });

    expect(response.status).toBe(401);
    expect(response.body).toBeTruthy();
  });
});
