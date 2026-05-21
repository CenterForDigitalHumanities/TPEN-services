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

    assert.match(appSource, /app\.use\('\/'\s*,\s*indexRouter\)/, 'indexRouter must be mounted at /')
    assert.match(appSource, /app\.use\('\/project\/:projectId\/page\/:pageId\/line'\s*,\s*lineRouter\)/, 'lineRouter must be mounted under the project/page hierarchy')
    assert.match(appSource, /app\.use\('\/project\/:projectId\/page'\s*,\s*pageRouter\)/, 'pageRouter must be mounted under /project/:projectId/page')
    assert.match(appSource, /app\.use\('\/project'\s*,\s*projectRouter\)/, 'projectRouter must be mounted at /project')
  })

  it('keeps column and clear-column page route seams', () => {
    const pageSource = readWorkspaceFile('page/index.js')

    assert.match(pageSource, /router\.route\('\/:pageId\/column'\)/, 'page router must declare a /:pageId/column route')
    assert.match(pageSource, /\.post\(auth0Middleware\(\)/, '/:pageId/column must accept POST guarded by auth0Middleware')
    assert.match(pageSource, /\.put\(auth0Middleware\(\)/, '/:pageId/column must accept PUT guarded by auth0Middleware')
    assert.match(pageSource, /\.patch\(auth0Middleware\(\)/, '/:pageId/column must accept PATCH guarded by auth0Middleware')
    assert.match(pageSource, /router\.route\('\/:pageId\/clear-columns'\)/, 'page router must declare a /:pageId/clear-columns route')
    assert.match(pageSource, /\.delete\(auth0Middleware\(\)/, '/:pageId/clear-columns must accept DELETE guarded by auth0Middleware')
  })

  it('keeps line route write seams and text patch endpoint', () => {
    const lineSource = readWorkspaceFile('line/index.js')

    assert.match(lineSource, /router\.post\('\/'\s*,\s*auth0Middleware\(\)/, 'line router must accept POST / guarded by auth0Middleware')
    assert.match(lineSource, /router\.put\('\/:lineId'\s*,\s*auth0Middleware\(\)/, 'line router must accept PUT /:lineId guarded by auth0Middleware')
    assert.match(lineSource, /router\.patch\('\/:lineId\/text'\s*,\s*auth0Middleware\(\)/, 'line router must expose PATCH /:lineId/text guarded by auth0Middleware')
    assert.match(lineSource, /router\.patch\('\/:lineId\/bounds'\s*,\s*auth0Middleware\(\)/, 'line router must expose PATCH /:lineId/bounds guarded by auth0Middleware')
  })
})
