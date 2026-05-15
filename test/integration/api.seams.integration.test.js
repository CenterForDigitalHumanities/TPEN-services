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

    assert.equal(fs.existsSync(apiHtml), true)
  })

  it('keeps root router method guard response contract in source', () => {
    const indexRouterSource = fs.readFileSync(path.join(repoRoot, 'index.js'), 'utf8')

    assert.match(indexRouterSource, /\.all\(\(_req, res, next\) => \{/)
    assert.match(indexRouterSource, /respondWithError\(res, 404, 'There is nothing for you here\.'/)
  })

  it('keeps CORS middleware and fallback 404 handler in app source', () => {
    const appSource = fs.readFileSync(path.join(repoRoot, 'app.js'), 'utf8')

    assert.match(appSource, /app\.use\(cors\(corsOptions\)\)/)
    assert.match(appSource, /app\.use\('\*_', \(req, res\) => \{/)
  })
})
