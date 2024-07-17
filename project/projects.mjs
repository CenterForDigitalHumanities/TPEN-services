import express from "express"
import {respondWithError} from "../utilities/shared.mjs"
import cors from "cors"
import common_cors from "../utilities/common_cors.json" assert {type: "json"}
import auth0Middleware from "../auth/index.mjs"
import Project from "../classes/Project/Project.mjs"
import {User} from "../classes/User/User.mjs"

let router = express.Router()

router.use(cors(common_cors))

router.route("/").get(auth0Middleware(), async (req, res) => {
  let user = req.user

  const userObj = new User()
  userObj
    .getByAgent(user?.agent)
    .then((user) => {
      const projectObj = new Project(user?._id)

      projectObj.getProjects().then((userData) => {
        res.status(200).json(userData)
      })
    })
    .catch((error) => {
      return respondWithError(
        res,
        error.status || error.code || 500,
        error.message ?? "An error occurred while fetching the user data."
      )
    })
})

export default router
