import { createGitHubIssue } from './githubService.js'
import { respondWithError } from "../utilities/shared.mjs"

export async function submitFeedback(req, res) {
  const user = req.user ? `${req.user.profile.displayName} (${req.user._id})` : 'Anonymous'
  const { page, feedback } = req.body

  if (!feedback) {
    return res.status(204).send()
  }

  try {
    await createGitHubIssue('Feedback', `Feedback from ${user}`, `Page: ${page}\n\nFeedback: ${feedback}`)
    res.status(200).json({ message: 'Feedback submitted successfully' })
  } catch (error) {
    respondWithError(res, error.status ?? 500, error.message ?? 'Failed to submit feedback')
  }
}

export async function submitBug(req, res) {
  const user = req.user ? `${req.user.profile.displayName} (${req.user._id})` : 'Anonymous'
  const { page, bugDescription } = req.body

  if (!bugDescription) {
    return res.status(204).send()
  }

  try {
    await createGitHubIssue('Bug Report', `Bug reported by ${user}`, `Page: ${page}\n\nBug: ${bugDescription}`)
    res.status(200).json({ message: 'Bug report submitted successfully' })
  } catch (error) {
    respondWithError(res, error.status ?? 500, error.message ??'Failed to submit bug report')
  }
}
