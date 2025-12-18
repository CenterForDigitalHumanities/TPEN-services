import express from "express"
import { respondWithError } from "../utilities/shared.js"
import cors from "cors"
import common_cors from "../utilities/common_cors.json" with {type: "json"}
import User from "../classes/User/User.js"

let router = express.Router()
router.use(cors(common_cors))

router.route("/:id").get(async (req, res) => {
  const userId = req.params?.id
  if (!userId) return respondWithError(res, 400, "User ID is required")
  const userObj = new User(userId)
  let publicProfile
  try {
    publicProfile = await userObj.getPublicInfo()
  }
  catch(err) {
    return respondWithError(res, 404, "User not found")
  }
  if (!publicProfile) return respondWithError(res, 404, "User not found")
  res.status(200).json(publicProfile)
}).all((req, res) => { return respondWithError(res, 405, "Improper request method. Use GET instead") })

export default router
