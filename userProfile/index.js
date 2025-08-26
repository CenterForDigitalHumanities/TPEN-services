import express from "express"
import { respondWithError } from "../utilities/shared.js"
import cors from "cors"
import common_cors from "../utilities/common_cors.json" with {type: "json"}
import User from "../classes/User/User.js"

let router = express.Router()
router.use(cors(common_cors))

router.route("/:id").get(async (req, res) => {
  const userId = req.params.id
  if (!userId) return respondWithError(res, 400, "User ID is required")
  try {
    const userObj = new User(userId)
    const publicProfile = await userObj.getPublicInfo()
    if (!publicProfile) return respondWithError(res, 404, "User not found")
    res.status(200).json(publicProfile)
  } catch (error) {
    respondWithError(res, error.status || error.code || 500, error.message ?? "An error occurred while fetching the user data.")
  }
}).all((req, res) => respondWithError(res, 405, "Improper request method. Use GET instead"))

export default router
