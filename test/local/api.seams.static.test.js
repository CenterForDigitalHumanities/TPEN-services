import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '../..')

function readWorkspaceFile(relativePath) {
  const filePath = path.join(repoRoot, relativePath)
  return fs.readFileSync(filePath, 'utf8')
}

describe('API seam contracts (static)', () => {
  it('keeps core app route mounts in app.js', () => {
    const appSource = readWorkspaceFile('app.js')

    assert.match(appSource, /app\.use\('\/'\s*,\s*indexRouter\)/)
    assert.match(appSource, /app\.use\('\/project\/:projectId\/page\/:pageId\/line'\s*,\s*lineRouter\)/)
    assert.match(appSource, /app\.use\('\/project\/:projectId\/page'\s*,\s*pageRouter\)/)
    assert.match(appSource, /app\.use\('\/project'\s*,\s*projectRouter\)/)
  })

  it('keeps column and clear-column page route seams', () => {
    const pageSource = readWorkspaceFile('page/index.js')

    assert.match(pageSource, /router\.route\('\/:pageId\/column'\)/)
    assert.match(pageSource, /\.post\(auth0Middleware\(\)/)
    assert.match(pageSource, /\.put\(auth0Middleware\(\)/)
    assert.match(pageSource, /\.patch\(auth0Middleware\(\)/)
    assert.match(pageSource, /router\.route\('\/:pageId\/clear-columns'\)/)
    assert.match(pageSource, /\.delete\(auth0Middleware\(\)/)
  })

  it('keeps line route write seams and text patch endpoint', () => {
    const lineSource = readWorkspaceFile('line/index.js')

    assert.match(lineSource, /router\.post\('\/'\s*,\s*auth0Middleware\(\)/)
    assert.match(lineSource, /router\.put\('\/:lineId'\s*,\s*auth0Middleware\(\)/)
    assert.match(lineSource, /router\.patch\('\/:lineId\/text'\s*,\s*auth0Middleware\(\)/)
    assert.match(lineSource, /router\.patch\('\/:lineId\/bounds'\s*,\s*auth0Middleware\(\)/)
  })
})
