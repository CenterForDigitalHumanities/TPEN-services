#!/usr/bin/env node

/** Server initializer for the app.  Registers all the route paths. */ 

import createError from 'http-errors'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'

let storedEnv = dotenv.config()
dotenvExpand.expand(storedEnv)

import logger from 'morgan'
import cors from 'cors'
import indexRouter from './index.js'
import manifestRouter from './manifest/index.js'
import projectRouter from './project/index.js'
import lineRouter from './line/index.js'
import userProfileRouter from './userProfile/index.js'
import privateProfileRouter from './userProfile/privateProfile.js'
import proxyRouter from './utilities/proxy.js'

// Beta Feedback routes
import feedbackRouter from './feedback/feedbackRoutes.js'

let app = express()

//Middleware to use
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

//Publicly available scripts, CSS, and HTML pages.
app.use(express.static(path.join(__dirname, 'public')))

/**
 * For any request that comes through to the app, check whether or not we are in maintenance mode.
 * If we are, then respond with a 503 and a message.  Otherwise, continue on.
 */
app.all('*', (req, res, next) => {
  if (process.env.DOWN === 'true') {
    res
      .status(503)
      .json({
        message:
          'TPEN3 services are down for updates or maintenance at this time.  We apologize for the inconvenience.  Try again later.',
      })
  } else {
    next() //pass on to the next app.use
  }
})

app.use('/', indexRouter)
app.use('/manifest', manifestRouter)
app.use('/project/:projectId/page/:pageId/line', lineRouter) 
app.use('/project', projectRouter)
app.use('/user', userProfileRouter)
app.use('/my',  privateProfileRouter) 
app.use('/proxy', proxyRouter)
 
// Beta Feedback routes
app.use('/beta', feedbackRouter)

//catch 404 because of an invalid site path
app.use('*', function(req, res, next) {
    let message = res.statusMessage ?? "This page does not exist"
    res.status(404).json({message})  
})

export {app as default}
