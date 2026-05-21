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

    // Slice each route's block from its `router.route(...)` declaration up to the next
    // top-level `router.` call. This anchors method/middleware assertions to a single
    // route so a mutation removing auth from one route can't be masked by an identical
    // chain on a sibling route.
    const sliceRoute = (path) => {
      const pattern = new RegExp(`router\\.route\\('${path}'\\)([\\s\\S]*?)\\n(?:router\\.|export )`)
      return pageSource.match(pattern)?.[1] ?? ''
    }

    assert.match(pageSource, /router\.route\('\/:pageId\/column'\)/, 'page router must declare a /:pageId/column route')
    const columnRoute = sliceRoute('\\/:pageId\\/column')
    assert.notEqual(columnRoute, '', '/:pageId/column route block must be extractable')
    assert.match(columnRoute, /\.post\(auth0Middleware\(\)/, '/:pageId/column must accept POST guarded by auth0Middleware')
    assert.match(columnRoute, /\.put\(auth0Middleware\(\)/, '/:pageId/column must accept PUT guarded by auth0Middleware')
    assert.match(columnRoute, /\.patch\(auth0Middleware\(\)/, '/:pageId/column must accept PATCH guarded by auth0Middleware')

    assert.match(pageSource, /router\.route\('\/:pageId\/clear-columns'\)/, 'page router must declare a /:pageId/clear-columns route')
    const clearColumnsRoute = sliceRoute('\\/:pageId\\/clear-columns')
    assert.notEqual(clearColumnsRoute, '', '/:pageId/clear-columns route block must be extractable')
    assert.match(clearColumnsRoute, /\.delete\(auth0Middleware\(\)/, '/:pageId/clear-columns must accept DELETE guarded by auth0Middleware')

    assert.match(pageSource, /router\.route\('\/:pageId\/resolved'\)/, 'page router must declare a /:pageId/resolved read endpoint')
    const resolvedRoute = sliceRoute('\\/:pageId\\/resolved')
    assert.notEqual(resolvedRoute, '', '/:pageId/resolved route block must be extractable')
    assert.match(resolvedRoute, /\.get\(async \(req, res\) => \{/, '/:pageId/resolved must accept GET — read seam is part of the published contract')
  })

  it('keeps line route write seams and text patch endpoint', () => {
    const lineSource = readWorkspaceFile('line/index.js')

    assert.match(lineSource, /router\.post\('\/'\s*,\s*auth0Middleware\(\)/, 'line router must accept POST / guarded by auth0Middleware')
    assert.match(lineSource, /router\.put\('\/:lineId'\s*,\s*auth0Middleware\(\)/, 'line router must accept PUT /:lineId guarded by auth0Middleware')
    assert.match(lineSource, /router\.patch\('\/:lineId\/text'\s*,\s*auth0Middleware\(\)/, 'line router must expose PATCH /:lineId/text guarded by auth0Middleware')
    assert.match(lineSource, /router\.patch\('\/:lineId\/bounds'\s*,\s*auth0Middleware\(\)/, 'line router must expose PATCH /:lineId/bounds guarded by auth0Middleware')
  })
})
