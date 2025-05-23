#!/usr/bin/env node

/**
 * Module dependencies.
 */
import app from '../app.js'
import debug from 'debug'
debug('tpen3_services:server')
import http from 'http'
import dotenv from 'dotenv'
dotenv.config()

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT ?? '3001')
app.set('port', port)

/**
 * Create HTTP server.
 */

let server = http.createServer(app)
/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

/**
 * Control the keep alive header
 */ 
// Ensure all inactive connections are terminated by the ALB, by setting this a few seconds higher than the ALB idle timeout
server.keepAliveTimeout = 8 * 1000 //8 seconds
// Ensure the headersTimeout is set higher than the keepAliveTimeout due to this nodejs regression bug: https://github.com/nodejs/node/issues/27363
server.headersTimeout = 8.5 * 1000 //8 seconds

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const portCheck = parseInt(val, 10)

  if (isNaN(portCheck)) {
    // named pipe
    return val
  }

  if (portCheck >= 0) {
    // port number
    return portCheck
  }

  return false
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  let bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  console.log("LISTENING ON "+port)
  const addr = server.address()
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port
  debug('Listening on ' + bind)
}
