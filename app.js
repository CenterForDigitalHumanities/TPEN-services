#!/usr/bin/env node

/** Server initializer for the app.  Registers all the route paths. */

import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import cookieParser from 'cookie-parser'
import cors from 'cors'

import logger from 'morgan'
import indexRouter from './index.js'
import projectRouter from './project/index.js'
import pageRouter from './page/index.js'
import lineRouter from './line/index.js'
import userProfileRouter from './userProfile/index.js'
import privateProfileRouter from './userProfile/privateProfile.js'
import proxyRouter from './utilities/proxy.js'
import feedbackRouter from './feedback/feedbackRoutes.js'

let app = express()

// CORS configuration - Open to all origins
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  optionsSuccessStatus: 200,
  methods : "GET,OPTIONS,HEAD,PUT,PATCH,DELETE,POST",
  allowedHeaders : [
      'Content-Type',
      'Content-Length',
      'Allow',
      'Authorization',
      'Location',
      'Connection',
      'Keep-Alive',
      'Date',
      'Cache-Control',
      'Last-Modified',
      'Link',
      'Origin',
      'Referrer',
      'User-Agent'
    ]
}

//Middleware to use
app.use(cors(corsOptions))
app.use(logger('dev'))
app.use(express.json())
app.use(express.text())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

//Publicly available scripts, CSS, and HTML pages.
app.use(express.static(path.join(__dirname, 'public')))

/**
 * For any request that comes through to the app, check whether or not we are in maintenance mode.
 * If we are, then respond with a 503 and a message.  Otherwise, continue on.
 */
app.all('*_', (req, res, next) => {
  if (process.env.DOWN === 'true') {
    return res.status(503).json({
      message:
        'TPEN3 services are down for updates or maintenance at this time.  We apologize for the inconvenience.  Try again later.'
    })
  }
  next()
})

app.use('/', indexRouter)
app.use('/project/:projectId/page/:pageId/line', lineRouter) 
app.use('/project/:projectId/page', pageRouter) 
app.use('/project', projectRouter)
app.use('/user', userProfileRouter)
app.use('/my', privateProfileRouter)
app.use('/proxy', proxyRouter)
app.use('/beta', feedbackRouter)

// Centralized error handling middleware
// Catches all thrown errors (auth, body-parser, unhandled exceptions)
// Note: Morgan already logs request info, so we focus on error details
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  // ANSI color codes for pm2 logs visibility
  const colors = {
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
  }

  // Color based on status code: red for 5xx, yellow for 4xx
  const statusColor = status >= 500 ? colors.red : colors.yellow

  // Log error details (Morgan already logs the request)
  console.error(`${statusColor}Error ${status}: ${message}${colors.reset}`)

  // Log stack trace for server errors only
  if (status >= 500 && err.stack) {
    console.error(`${colors.cyan}${err.stack}${colors.reset}`)
  }

  // Return consistent JSON, hide internal details from clients
  if (!res.headersSent) {
    res.status(status).json({
      message: status >= 500 ? 'Internal Server Error' : message
    })
  }
})

//catch 404 because of an invalid site path
app.use('*_', (req, res) => {
  res.status(404).json({ message: res.statusMessage ?? 'This page does not exist' })
})

export { app as default }
