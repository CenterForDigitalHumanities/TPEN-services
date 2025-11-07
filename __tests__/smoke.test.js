#!/usr/bin/env node

/**
 * Post-deployment smoke tests for TPEN Services
 * Validates basic functionality after deployment
 */

import https from 'https'
import http from 'http'

const BASE_URL = process.env.SMOKE_TEST_URL || 'http://localhost:3001'
const isHttps = BASE_URL.startsWith('https')
const httpModule = isHttps ? https : http

console.log(`\n🔍 Running smoke tests against: ${BASE_URL}\n`)

const tests = []
let passed = 0
let failed = 0

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

async function test(name, fn) {
  try {
    await fn()
    console.log(`✅ ${name}`)
    passed++
  } catch (error) {
    console.error(`❌ ${name}`)
    console.error(`   ${error.message}`)
    failed++
  }
}

// Test 1: Root endpoint returns expected content
await test('Root endpoint returns service identifier', async () => {
  const res = await request('/')
  if (res.status !== 200) {
    throw new Error(`Expected 200, got ${res.status}`)
  }
  if (!res.data.includes('TPEN3 SERVICES BABY')) {
    throw new Error('Expected service identifier not found in response')
  }
})

// Test 2: Protected endpoint requires authentication
await test('Protected endpoint requires authentication', async () => {
  const res = await request('/my/profile')
  if (res.status !== 401) {
    throw new Error(`Expected 401, got ${res.status}`)
  }
})

// Test 3: CORS headers present for allowed origin
await test('CORS headers present for allowed origins', async () => {
  const res = await request('/', {
    headers: {
      'Origin': 'https://app.t-pen.org'
    }
  })
  const corsHeader = res.headers['access-control-allow-origin']
  if (!corsHeader) {
    throw new Error('CORS header not present')
  }
})

// Test 4: Invalid route returns 404
await test('Invalid route returns 404', async () => {
  const res = await request('/this-does-not-exist')
  if (res.status !== 404) {
    throw new Error(`Expected 404, got ${res.status}`)
  }
})

// Test 5: Service responds within acceptable time
await test('Service responds within 3 seconds', async () => {
  const start = Date.now()
  await request('/', { timeout: 3000 })
  const duration = Date.now() - start
  if (duration > 3000) {
    throw new Error(`Response took ${duration}ms (> 3000ms)`)
  }
})

// Summary
console.log(`\n${'='.repeat(50)}`)
console.log(`📊 Results: ${passed} passed, ${failed} failed`)
console.log(`${'='.repeat(50)}\n`)

if (failed > 0) {
  process.exit(1)
}

console.log('✨ All smoke tests passed!\n')
