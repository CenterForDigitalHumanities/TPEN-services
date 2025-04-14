import express from 'express'
import auth0Middleware from "../auth/index.mjs"
import cors from 'cors'
import { submitFeedback, submitBug } from './feedbackController.js'
import common_cors from '../utilities/common_cors.json' with {type: 'json'}

const feedbackRouter = express.Router()
feedbackRouter.use(
  cors(common_cors)
)
feedbackRouter.route('/feedback').post(auth0Middleware(), submitFeedback)
feedbackRouter.route('/bug').post(auth0Middleware(), submitBug)

export default feedbackRouter
