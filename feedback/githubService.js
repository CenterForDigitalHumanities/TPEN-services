const axios = require('axios')

const GITHUB_REPO = 'your-username/your-repo'
const GITHUB_TOKEN = 'your-github-token'

async function createGitHubIssue(label, title, body) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/issues`
  const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json'
  }

  const data = {
    title,
    body,
    labels: [label]
  }

  await axios.post(url, data, { headers })
}

module.exports = { createGitHubIssue }
