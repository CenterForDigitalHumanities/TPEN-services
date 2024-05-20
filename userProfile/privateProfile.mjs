import express from "express"
import {respondWithError, respondWithJSON} from "../utilities/shared.mjs"
import {User} from "../classes/User/User.mjs"
import common_cors from '../utilities/common_cors.json' assert {type: 'json'}
import cors from "cors"

const router = express.Router()
router.use(
  cors(common_cors)
)

router.get("/profile", async (req, res) => {
  const user = await req.user 
  if (!user) return respondWithError(res, 401, "Unauthorized user") 
  const userObj = new User(user._id)
  const userProfile = await userObj.getSelf()
  res.set("Content-Type", "application/json; charset=utf-8") 

  res.status(200).json(userProfile)
})

router.get("/projects", async (req, res) => {
  const {_id} = await req.user 

  if (!_id) return respondWithError(res, 401, "Unauthorized user")

  const userObj = new User(_id) 
  const userProjects = await userObj.getProjects()

  res.set("Content-Type", "application/json; charset=utf-8")

  res.status(200).json(userProjects)
})

 

export default router