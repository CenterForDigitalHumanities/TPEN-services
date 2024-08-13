import express from "express"
import cors from "cors"
import common_cors from ".././common_cors.json" assert {type: "json"}
import {sendMail} from "./index.mjs"

let router = express.Router()
router.use(cors(common_cors))

router.route("/sendmail").get(async (req, res) => {
  const receiver = {email: "notreal@scarvex.com", name: "Ohai"}
  const mailerResponse = await sendMail(
    receiver,
    "Notification of Registration",
    "Your registration was successful"
  )
  res.status(mailerResponse.status).send(mailerResponse.message)
})

export default router
