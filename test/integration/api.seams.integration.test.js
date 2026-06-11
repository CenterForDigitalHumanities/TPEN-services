import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '../..')

describe('API seam integration', () => {
  it('keeps public static API docs artifact present', () => {
    const apiHtml = path.join(repoRoot, 'public/API.html')

    assert.equal(fs.existsSync(apiHtml), true, 'public/API.html must be served as the API reference')
  })

  it('keeps root router method guard response contract in source', () => {
    const indexRouterSource = fs.readFileSync(path.join(repoRoot, 'index.js'), 'utf8')

    assert.match(indexRouterSource, /\.all\(\(_req, res, next\) => \{/, 'index router must declare a method-guard .all handler')
    assert.match(indexRouterSource, /respondWithError\(res, 404, 'There is nothing for you here\.'/, 'method-guard must respond with the documented 404 contract message')
  })

  it('keeps CORS middleware and fallback 404 handler in app source', () => {
    const appSource = fs.readFileSync(path.join(repoRoot, 'app.js'), 'utf8')

    assert.match(appSource, /app\.use\(cors\(corsOptions\)\)/, 'app must register the cors middleware with the configured options')
    assert.match(appSource, /app\.use\('\*_', \(req, res\) => \{/, 'app must register the catch-all 404 handler')
  })

  it('keeps maintenance-mode .all gate in app source', () => {
    const appSource = fs.readFileSync(path.join(repoRoot, 'app.js'), 'utf8')

    // app.js declares two `*_` handlers: the maintenance .all gate (runs first,
    // returns 503 when DOWN=true) and the catch-all .use 404. Anchor on the
    // .all+DOWN condition together so a mutation that removes the gate — or
    // inverts the env check — fails this test rather than silently letting
    // traffic through during a declared outage.
    assert.match(
      appSource,
      /app\.all\('\*_', \(req, res, next\) => \{[\s\S]*?process\.env\.DOWN === 'true'/,
      'app must declare an .all maintenance gate that branches on DOWN === "true"'
    )
    assert.match(
      appSource,
      /respondWithError\(\s*res,\s*503,/,
      'maintenance gate must respond with 503 (not a generic 500 or 4xx)'
    )
  })
})
