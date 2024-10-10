import userProfileRouter from "../index.mjs"
import privateUserRouter from "../privateProfile.mjs"
import mainApp from "../../app.mjs"
import express from "express"
import request from "supertest"
import app from '../../app.mjs';  
import { User } from "../../classes/User/User.mjs";

import {jest} from "@jest/globals"


const routeTester = new express()
const privateRoutesTester = new express()
routeTester.use("/user", userProfileRouter)
privateRoutesTester.use("/my", privateUserRouter)

describe("Test private routes restfulness #user_class", () => {
  it("POST instead of GET. That status should be 405 with a message.", async () => {
    const res = await request(mainApp).post("/my/profile")
    expect(res.statusCode).toBe(405)
    expect(res.body).toBeTruthy()
  })

})

describe("Unauthourized GETs    #user_class", () => {
  it("/my/profile should return 401", async () => {
    const response = await request(mainApp)
      .get("/my/profile") 
    expect(response.status).toBe(401)
    expect(response.body).toBeTruthy()
  })

  it("/my/project should return 401 #user_class", async () => {
    const response = await request(mainApp)
      .get("/my/projects") 
    expect(response.status).toBe(401)
    expect(response.body).toBeTruthy()
  })
})

describe('userProfile endpoint end to end unit test (spinning up the endpoint and using it). #end2end_unit', () => {

  it('POST instead of GET. That status should be 404 with a message.', async () => {
    const res = await request(routeTester)
      .post('/user/')
    expect(res.statusCode).toBe(404)
    expect(res.body).toBeTruthy()
  })

  it('PUT instead of GET. That status should be 404 with a message.', async () => {
    const res = await request(routeTester)
      .put('/user/')
    expect(res.statusCode).toBe(404)
    expect(res.body).toBeTruthy()
  })

  it('PATCH instead of GET. That status should be 404 with a message.', async () => {
    const res = await request(routeTester)
      .patch('/user/')
    expect(res.statusCode).toBe(404)
    expect(res.body).toBeTruthy()
  })

  it('Call to /user with a TPEN3 user ID that does not exist. The status should be 400 with a message.', async () => {
    const res = await request(routeTester)
      .get('/user/')
    expect(res.statusCode).toBe(400)
    expect(res.body).toBeTruthy()
  })

  it('Call to /user with a TPEN3 user ID that is  invalid', async () => {
    const res = await request(routeTester)
      .get('/user/kjl')
    expect(res.statusCode).toBe(400)
    expect(res.body).toBeTruthy()
  })

  it('Call to /user with a TPEN3 user ID that does exist. The status should be 200 with a JSON user profile in the body.', async () => {
    const res = await request(routeTester)
      .get('/user/123')
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeTruthy()
  })
})
 
describe('GET /:id route #testThis', () => {
  it('should respond with status 400 if no user ID is provided', async () => {
    const response = await request(app).get('/user/');
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('No user ID provided');
  });

  it('should respond with status 400 if the provided user ID is invalid', async () => {
    const response = await request(app).get('/user/jkl');
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('The TPEN3 user ID is invalid');
  });

 
  it.skip('should respond with status 404 and a message if no user found with provided ID', async () => {
     jest.spyOn(User.prototype, 'getById').mockResolvedValueOnce({});

    const response = await request(app).get('/user/123');
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("No TPEN3 user with ID '123' found");
  });


});

