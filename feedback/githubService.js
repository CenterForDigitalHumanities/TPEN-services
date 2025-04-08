export async function createGitHubIssue(label, title, body) {
  const url = `https://api.github.com/repos/${process.env.REPO_OWNER}/${process.env.REPO_NAME}/issues`
  const headers = {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title,
      body,
      labels: [label]
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`GitHub API error: ${error.message}`)
  }
}
