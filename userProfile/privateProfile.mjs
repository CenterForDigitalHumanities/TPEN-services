import express from "express"
import {respondWithError, respondWithJSON} from "../utilities/shared.mjs"
import User from "../classes/User/User.mjs"
import common_cors from '../utilities/common_cors.json' with {type: 'json'}
import cors from "cors"
import auth0Middleware from "../auth/index.mjs"

const router = express.Router()
router.use(
  cors(common_cors)
)

router.route("/profile").get(auth0Middleware(), async (req, res) => {
  const user = req.user
  if (!user) return respondWithError(res, 401, "Unauthorized user")
  try {
    res.status(200).json(user)
  } catch(error) {
      respondWithError(res, error.status || error.code || 500, error.message?? "An error occurred while fetching the user data.")
  }
}).all((req, res)=>    respondWithError(res, 405, "Improper request method. Use GET instead"))

router.route("/profile/:id/update").put(auth0Middleware(), async (req, res) => {
  const user = req.user
  if (!user) return respondWithError(res, 401, "Unauthorized user")
  try {
    const userObj = new User(user._id)
    const userProfile = await userObj.updateProfile(req.body)
    res.status(200).json(userProfile)
  } catch (error) {
    respondWithError(res, error?.status??500, error?.message??error.toString())
  }
}).all((req, res)=>    respondWithError(res, 405, "Improper request method. Use PUT instead"))

router.route("/projects").get(auth0Middleware(), async (req, res) => {
  const user = await req.user
  if (!user) return respondWithError(res, 401, "Unauthorized user")
   try {
    const userObj = await new User(user._id)
    const userProjects = await userObj.getProjects()

    res.set("Content-Type", "application/json; charset=utf-8")

    res.status(200).json(userProjects)
  } catch (error) {
    respondWithError(res, error?.status??500, error?.message??error.toString())
  }
}).all((req, res)=>    respondWithError(res, 405, "Improper request method. Use GET instead")
)

 
export default router
