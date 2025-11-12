import express from "express"
import { respondWithError } from "../utilities/shared.js"
import User from "../classes/User/User.js"
import common_cors from '../utilities/common_cors.json' with {type: 'json'}
import cors from "cors"
import auth0Middleware from "../auth/index.js"
import { isSuspiciousJSON, isSuspiciousValueString } from "../utilities/checkIfSuspicious.js"

const router = express.Router()
router.use(
  cors(common_cors)
)

router.route("/profile").get(auth0Middleware(), async (req, res) => {
  const user = req.user
  if (!user) return respondWithError(res, 401, "Unauthorized user")
  try {
    res.status(200).json(user)
  } catch (error) {
    respondWithError(res, error.status || error.code || 500, error.message ?? "An error occurred while fetching the user data.")
  }
}).put(auth0Middleware(), async (req, res) => {
  const user = req.user
  if (!user) return respondWithError(res, 401, "Unauthorized user")
  try {
    if (req.body && !Array.isArray(req.body)) {
      for (const key in req.body) {
        if (isSuspiciousJSON(req.body[key]) || isSuspiciousValueString(req.body[key], true))
          return respondWithError(res, 400, "Suspicious profile data will not be processed.")
      }
    }
    const userObj = new User(user._id)
    const userProfile = await userObj.updateProfile(req.body)
    res.status(200).json(userProfile)
  } catch (error) {
    respondWithError(res, error.status || error.code || 500, error.message ?? "An error occurred while fetching the user data.")
  }
}).all((req, res) => respondWithError(res, 405, "Improper request method. Use PUT instead"))

router.route("/projects").get(auth0Middleware(), async (req, res) => {
  const user = await req.user
  if (!user) return respondWithError(res, 401, "Unauthorized user")
  try {
    const userObj = await new User(user._id)
    const userProjects = await userObj.getProjects()
    const validMetrics = userProjects.filter((proj) => proj._createdAt && proj._modifiedAt && proj._lastModified)
    if (validMetrics.length === 0) {
      return respondWithError(res, 404, "No valid projects found")
    }

    // TODO: When the projects are all formatted correctly, we will not need this

    const newestProject = validMetrics.reduce((max, proj) => proj._createdAt > max._createdAt ? proj : max, {_createdAt: 0})
    const lastModifiedProject = validMetrics.reduce((max, proj) => proj._modifiedAt > max._modifiedAt ? proj : max, {_modifiedAt: 0})

    const newest = `project:${newestProject._id}/page:${newestProject._lastModified}`
    const lastModified = `project:${lastModifiedProject._id}/page:${lastModifiedProject._lastModified}`

    const userData = await userObj.getSelf()
    const myRecent = userData._lastModified

    res.set("Content-Type", "application/json; charset=utf-8")

    res.status(200).json({
      metrics: {
        newest,
        lastModified,
        myRecent
      },
      projects: userProjects
    })
  } catch (error) {
    respondWithError(res, error?.status ?? 500, error?.message ?? error.toString())
  }
}).all((req, res) => respondWithError(res, 405, "Improper request method. Use GET instead")
)


export default router
