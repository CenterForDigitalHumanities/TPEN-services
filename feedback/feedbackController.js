import { createGitHubIssue } from './githubService.js'
import { respondWithError } from "../utilities/shared.js"

/**
 * 
 * @param {user, body: page, feedback } req auth offers user and API is used with body: page:URL, feedback:String 
 * @param {Response} res Express response object
 * @description This function handles the submission of feedback from the user. It creates a GitHub issue with the feedback details.
 * @returns 200 if feedback is submitted successfully, 204 if no feedback is provided, or an error response if the submission fails.
 */
export async function submitFeedback(req, res) {
  const user = req.user ? `${req.user.profile.displayName} (${req.user._id})` : 'Anonymous'
  const { page, feedback } = req.body

  if (!feedback) {
    return res.status(204).send()
  }
  try {
    await createGitHubIssue('Feedback', `Feedback from ${user}`, `Page: ${page}\n\nFeedback: ${sanitizeUserInput(feedback)}`)
    res.status(200).json({ message: 'Feedback submitted successfully' })
  } catch (error) {
    respondWithError(res, error.status ?? 500, error.message ?? 'Failed to submit feedback')
  }
}

/**
 * 
 * @param {user, body: page, bugDescription } req auth offers user and API is used with body: page:URL, bugDescription:String 
 * @param {Response} res Express response object
 * @description This function handles the submission of bug reports from the user. It creates a GitHub issue with the bug details.
 * @returns 200 if the bug report is submitted successfully, 204 if no bug description is provided, or an error response if the submission fails.
 */
export async function submitBug(req, res) {
  const user = req.user ? `${req.user.profile.displayName} (${req.user._id})` : 'Anonymous'
  const { page, bugDescription } = req.body

  if (!bugDescription) {
    return res.status(204).send()
  }

  try {
    await createGitHubIssue('Bug Report', `Bug reported by ${user}`, `Page: ${page}\n\nBug: ${sanitizeUserInput(bugDescription)}`)
    res.status(200).json({ message: 'Bug report submitted successfully' })
  } catch (error) {
    respondWithError(res, error.status ?? 500, error.message ??'Failed to submit bug report')
  }
}

function sanitizeUserInput(input) {
  return input.replace(/[^\w\s.,!?'"()-]/g, '')
}
