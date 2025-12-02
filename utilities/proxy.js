import https from 'node:https'
import express from 'express'
import cors from 'cors'
import { respondWithError } from './shared.js'
import common_cors from "../utilities/common_cors.json" with {type: "json"}

const requireHeader = [
  'origin',
  'x-requested-with'
]

const excludedClientHeaders = new Set([
  'host',
  'cookie'
])

const excludedServerHeaders = new Set([
  'set-cookie',
  'connection'
])

const sizeLimit = 2e8 // 200 MB

const proxy = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  let targetUrl = req.originalUrl.replace(/^\/+proxy\/+/, '')
  if (!targetUrl) return respondWithError(res, 400, 'No URL provided')
  const headers = {}
  for (const header in req.headers) {
    if (!excludedClientHeaders.has(header.toLowerCase())) {
      headers[header] = req.headers[header]
    }
  }
  const forwardedFor = req.headers['x-forwarded-for']
  headers['X-Forwarded-For'] = (forwardedFor ? forwardedFor + ',' : '') + req.connection.remoteAddress
  try {
    const parsedUrl = new URL(targetUrl)
    if (parsedUrl.protocol === 'http:') {
      parsedUrl.protocol = 'https:'
      targetUrl = parsedUrl.toString()
    }
  } catch {
    return respondWithError(res, 400, 'Invalid URL')
  }
  let data = 0
  const proxyReq = https.request(targetUrl, {
    method: 'GET',
    headers
  }, (proxyRes) => {
    if (Number(proxyRes.headers['content-length']) > sizeLimit) {
      respondWithError(res, 413, `Maximum allowed size is ${sizeLimit} bytes`)
      proxyReq.destroy()
      return
    }
    res.statusCode = proxyRes.statusCode
    for (const header in proxyRes.headers) {
      if (!excludedServerHeaders.has(header.toLowerCase())) {
        res.setHeader(header, proxyRes.headers[header])
      }
    }
    proxyRes.on('data', chunk => {
      data += chunk.length
      if (data > sizeLimit) {
        respondWithError(res, 413, `Maximum allowed size is ${sizeLimit} bytes`)
        proxyReq.destroy()
        res.end()
        return
      }
      res.write(chunk)
    })
    proxyRes.on('end', () => {
      res.end()
    })
  })
  proxyReq.on('error', err => {
    respondWithError(res, 500, 'Proxy request failed')
  })
  proxyReq.end()
}

function opts(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET')
  res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers'))
  res.header('Access-Control-Max-Age', '86400')
  res.sendStatus(200)
}

const proxyRouter = express.Router()
proxyRouter.use(cors(common_cors))
proxyRouter.route('/*_')
  .options(opts)
  .get(proxy)

export default proxyRouter
