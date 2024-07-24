import express from "express"
import {respondWithError, validateID} from "../utilities/shared.mjs"
import cors from "cors"
import common_cors from "../utilities/common_cors.json" assert {type: "json"}
import {User} from "../classes/User/User.mjs"

let router = express.Router()
router.use(cors(common_cors))

router.route("/:id?").get(async (req, res) => {
  let {id} = req.params 
  // let id = "jkl"
   if (!id) {
    return respondWithError(res, 400, "No user ID provided")
  }
  
  if (!validateID(id)) {
    return respondWithError(res, 400, "The TPEN3 user ID is invalid")
  }
  const userObj = new User(id)
  userObj
    .getUserById()
    .then((userData) => {
      if(!Object.keys(userData).length){
        return respondWithError(res, 404, `No TPEN3 user with ID '${id}' found`)
      }
      res.status(200).json(userData)
    })
    .catch((error) => {
      respondWithError(
        res,
        error.status || error.code || 500,
        error.message ?? "An error occurred while fetching the user data."
      )
    })
})

export default router
