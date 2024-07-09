import express from "express"
import {respondWithError, respondWithJSON} from "../utilities/shared.mjs"
import {User} from "../classes/User/User.mjs"
import common_cors from '../utilities/common_cors.json' assert {type: 'json'}
import cors from "cors"
import auth0Middleware from "../auth/index.mjs"

const router = express.Router()
router.use(
  cors(common_cors)
)

router.get("/profile", auth0Middleware(), async (req, res) => {
  const user = req.user
  if (!user) return respondWithError(res, 401, "Unauthorized user")

  const userObj = new User(user._id)
  userObj
    .getSelf()
    .then((userData) => {
      res.status(200).json(userData)
    })
    .catch((error) => {
     respondWithError(res, error.status || error.code || 500, error.message?? "An error occurred while fetching the user data.")
    })
})

router.get("/projects", auth0Middleware(), async (req, res) => {
  const user = await req.user
  if (!user) return respondWithError(res, 401, "Unauthorized user")

  try {
    const userObj = new User(user._id)
    const userProjects = await userObj.getProjects()

    res.set("Content-Type", "application/json; charset=utf-8")

    res.status(200).json(userProjects)
  } catch (error) {
    respondWithError(res, error?.status, error?.message)
  }
})

export default router
