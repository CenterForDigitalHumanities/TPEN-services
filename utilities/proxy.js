import https from 'node:https'
import express from 'express'
import cors from 'cors'
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
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', '*')

    // Extract the target URL from the request path
    // Handle both /proxy/http://example.com and /proxy/https://example.com
    // Also handle the case with double slashes
    let targetUrl = req.originalUrl.replace(/^\/+proxy\/+/, '')

    if (!targetUrl) {
        res.status(400).send('No URL provided')
        return
    }

    // // Require Origin header
    // if (!requireHeader.some(header => req.headers[header])) {
    //     res.status(403).send('Origin: header is required')
    //     return
    // }

    // Forward client headers to server
    const headers = {}
    for (const header in req.headers) {
        if (!excludedClientHeaders.has(header.toLowerCase())) {
            headers[header] = req.headers[header]
        }
    }

    const forwardedFor = req.headers['x-forwarded-for']
    headers['X-Forwarded-For'] = (forwardedFor ? forwardedFor + ',' : '') + req.connection.remoteAddress

    // Parse URL and upgrade to HTTPS if needed
    try {
        const parsedUrl = new URL(targetUrl)
        
        // Force HTTPS by changing the protocol if it's currently HTTP
        if (parsedUrl.protocol === 'http:') {
            parsedUrl.protocol = 'https:'
            targetUrl = parsedUrl.toString()
        }
    } catch (e) {
        res.status(400).send('Invalid URL')
        return
    }

    let data = 0 // Track data size

    const proxyReq = https.request(targetUrl, {
        method: 'GET',
        headers
    }, (proxyRes) => {
        // Check content length - if it's larger than the size limit, end the request with a 413 error
        if (Number(proxyRes.headers['content-length']) > sizeLimit) {
            res.status(413).send(`ERROR 413: Maximum allowed size is ${sizeLimit} bytes.`)
            proxyReq.destroy()
            return
        }

        res.statusCode = proxyRes.statusCode

        // If the page already supports cors, redirect to the URL directly
        if (proxyRes.headers['access-control-allow-origin'] === '*') {
            res.redirect(targetUrl)
            proxyReq.destroy()
            return
        }

        // Include only desired headers
        for (const header in proxyRes.headers) {
            if (!excludedServerHeaders.has(header)) {
                res.header(header, proxyRes.headers[header])
            }
        }

        // Send headers before streaming the body
        res.flushHeaders()

        // Handle the data stream
        proxyRes.on('data', chunk => {
            data += chunk.length
            if (data > sizeLimit) {
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
        res.status(500).send(`Proxy Error: ${err.message}`)
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
proxyRouter.route('/*')
    .options(opts)
    .get(proxy)

export default proxyRouter
