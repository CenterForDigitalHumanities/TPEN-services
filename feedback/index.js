import express from 'express'
import bodyParser from 'body-parser'
import { createGitHubIssue } from './githubService.js'

const feedbackRouter = express.Router()
feedbackRouter.use(bodyParser.json())

// Endpoint for feedback form submissions
feedbackRouter.post('/submit-feedback', async (req, res) => {
  const { user, page, feedback } = req.body

  if (!feedback) {
    return res.status(400).json({ error: 'Feedback is required' })
  }

  try {
    await createGitHubIssue('Feedback', `Feedback from ${user}`, `Page: ${page}\n\nFeedback: ${feedback}`)
    res.status(200).json({ message: 'Feedback submitted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit feedback' })
  }
})

// Endpoint for bug report submissions
feedbackRouter.post('/submit-bug', async (req, res) => {
  const { user, page, bugDescription } = req.body

  if (!bugDescription) {
    return res.status(400).json({ error: 'Bug description is required' })
  }

  try {
    await createGitHubIssue('Bug Report', `Bug reported by ${user}`, `Page: ${page}\n\nBug: ${bugDescription}`)
    res.status(200).json({ message: 'Bug report submitted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit bug report' })
  }
})

export default feedbackRouter
