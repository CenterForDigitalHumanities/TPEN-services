/**
 * Centralized error handling middleware for Express.
 * Catches all thrown errors (auth, body-parser, unhandled exceptions).
 * Note: Morgan already logs request info, so this focuses on error details.
 *
 * @param {Error} err - The error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const routeErrorHandler = (err, req, res, next) => {
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
}

export default routeErrorHandler
