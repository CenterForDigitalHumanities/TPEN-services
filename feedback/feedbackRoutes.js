import express from 'express'
import auth0Middleware from "../auth/index.mjs"
import { submitFeedback, submitBug } from './feedbackController.js'

const feedbackRouter = express.Router()

feedbackRouter.route('/feedback').post(auth0Middleware, submitFeedback)
feedbackRouter.route('/bug').post(auth0Middleware, submitBug)

export default feedbackRouter
