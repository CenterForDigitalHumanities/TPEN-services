import express from "express"
import {respondWithError, respondWithJSON} from "../utilities/shared.mjs"
import {User} from "../classes/User/User.mjs"

import cors from "cors"
import auth0Middleware from "../auth/index.mjs"

const router = express.Router()
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

router.get("/profile", auth0Middleware(), async (req, res) => {
  const user = await req.user
  if (!user) return respondWithError(res, 401, "Unauthorized user")
  const userObj = new User(user._id)
  const userProfile = await userObj.getSelf()
  res.set("Content-Type", "application/json; charset=utf-8")

  res.status(200).json(userProfile)
})

router.get("/projects", auth0Middleware(), async (req, res) => {
  const user = await req.user
  if (!user) return respondWithError(res, 401, "Unauthorized user") 

  const userObj = new User(user._id)
  const userProjects = await userObj.getProjects()

  res.set("Content-Type", "application/json; charset=utf-8")

  res.status(200).json(userProjects)
})

export default router
