import express from "express"
import * as utils from "../utilities/shared.mjs"
//import * as service from './userProfile.mjs'
import {User} from "../classes/User/User.mjs"

import cors from "cors" 

import auth0Middleware from '../auth/index.mjs'

let router = express.Router()
router.use(
  cors({
    methods: "GET",
    allowedHeaders: [
      "Content-Type",
      "Content-Length",
      "Allow",
      "Authorization",
      "Location",
      "ETag",
      "Connection",
      "Keep-Alive",
      "Date",
      "Cache-Control",
      "Last-Modified",
      "Link",
      "X-HTTP-Method-Override"
    ],
    exposedHeaders: "*",
    origin: "*",
    maxAge: "600"
  })
)

router
  .route("/tester")
  .get(auth0Middleware(), async (req, res, next) => {
    console.log("auth applied.  This is the user from the token.")
    console.log(req.user)
    let agentURI = req.user['http://store.rerum.io/agent']
    console.log("This is the agent from the token")
    console.log(agentURI)
    const id = agentURI.split("/").pop()
    console.log("Noting that when this request was made there was no matching tpen.users user")
    console.log(`The user below should be a new, existing tpen.users user in the database with _id '${id}'`)
    const u = new User(id)
    const obj = await u.getSelf()
    console.log("This is the user obj from the resulting new User(id).getSelf() call")
    console.log(obj)
    res.status(200)
    res.send()
  })

router
  .route("/:id?")
  .get(async (req, res, next) => { 
    let id = req.params.id
    if (!id) {
      utils.respondWithError(res, 400, "No user ID provided")
      return
    }

    if (!utils.validateID(id)) {
      utils.respondWithError(res, 400, "The ID provided is invalid")
      return
    }

    try {
      const userObject = new User(id)
      if (userObject) {
        respondWithUserProfile(res, await userObject.getUserById())
      } else {
        utils.respondWithError(res, 404, `TPEN3 user "${id}" does not exist.`)
      }
    } catch (error) {
      utils.respondWithError(res, 500, error.message)
    }
  })

  //post handler
  .post(async (req, res, next) => {
    // open for future Modifications as needed
    utils.respondWithError(res, 501, "Not Implemented, please use GET.")
  })

  //put handler
  .put(async (req, res, next) => {
    // open for future Modifications as needed
    utils.respondWithError(res, 501, "Not Implemented, please use GET.")
  })

  .all((req, res, next) => {
    utils.respondWithError(res, 405, "Improper request method, please use GET.")
  })

function respondWithUserProfile(res, userObject) {
  res.set("Content-Type", "application/json; charset=utf-8")
  res.set("Location", `/user/${userObject._id}`)
  res.status(200).json(userObject)
}
 
export default router
