#!/usr/bin/env node

/**
 * Post-deployment smoke tests for TPEN Services
 * Validates basic functionality after deployment
 */

import https from 'https'
import http from 'http'

const BASE_URL = process.env.SMOKE_TEST_URL || 'http://localhost:3011'
const isHttps = BASE_URL.startsWith('https')
const httpModule = isHttps ? https : http

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const req = httpModule.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }))
    })
    req.on('error', reject)
    if (options.timeout) {
      req.setTimeout(options.timeout, () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })
    }
    req.end()
  })
}

async function runCheck(name, fn) {
  try {
    await fn()
    return { name, ok: true }
  } catch (err) {
    return { name, ok: false, error: err.message || String(err) }
  }
}

// Main smoke check function that can run standalone or in Jest
async function runSmokeChecks() {
  const checks = []

  // Root endpoint returns expected content
  checks.push(await runCheck('Root endpoint returns service index HTML', async () => {
    const res = await request('/')
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
    const hasHeading = res.data.includes('<h1>TPEN3 Services</h1>')
    const hasWelcome = res.data.toLowerCase().includes('welcome to')
    if (!(hasHeading || hasWelcome)) throw new Error('Expected TPEN3 Services index HTML not found in response')
  }))

  // Protected endpoint requires authentication (400 when Authorization header is missing)
  checks.push(await runCheck('Protected endpoint requires authentication', async () => {
    const res = await request('/my/profile')
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`)
  }))

  // CORS headers present for allowed origin
  checks.push(await runCheck('CORS headers present for allowed origins', async () => {
    const res = await request('/', {
      headers: { Origin: 'https://app.t-pen.org' }
    })
    const corsHeader = res.headers['access-control-allow-origin']
    if (!corsHeader) throw new Error('CORS header not present')
  }))

  // Invalid route returns 404
  checks.push(await runCheck('Invalid route returns 404', async () => {
    const res = await request('/this-does-not-exist')
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`)
  }))

  // Service responds within 3 seconds
  checks.push(await runCheck('Service responds within 3 seconds', async () => {
    const start = Date.now()
    await request('/', { timeout: 3000 })
    const duration = Date.now() - start
    if (duration > 3000) throw new Error(`Response took ${duration}ms (> 3000ms)`)
  }))

  const failed = checks.filter(c => !c.ok)
  if (failed.length > 0) {
    const msg = failed.map(f => `${f.name}: ${f.error}`).join('\n')
    throw new Error(`Smoke tests failed:\n${msg}`)
  }
  
  return { total: checks.length, passed: checks.length - failed.length, failed: failed.length }
}

// If running standalone (node script), execute and exit with appropriate code
// Check if this file is being run directly (not imported by Jest)
const isRunningStandalone = import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))
if (isRunningStandalone || (typeof test === 'undefined' && process.argv[1]?.includes('smoke.test.js'))) {
  console.log('Running smoke tests...')
  runSmokeChecks()
    .then(result => {
      console.log(`✓ All ${result.total} smoke checks passed`)
      process.exit(0)
    })
    .catch(err => {
      console.error('✗ Smoke tests failed:', err.message)
      process.exit(1)
    })
}

// If running in Jest, wrap in a test
if (typeof test !== 'undefined') {
  test('post-deployment smoke checks', async () => {
    await runSmokeChecks()
  }, 30000) // set a longer timeout for the whole test if needed
}
