import { JSDOM } from 'jsdom'
import DOMPurify from 'dompurify'
import { respondWithError } from './shared.js'

const window = new JSDOM('').window
const purify = DOMPurify(window)

/**
 * Middleware to check if request body contains suspicious content that could be malicious
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next function
 */
export default function checkIfSuspicious(req, res, next) {
  if (!req.body || typeof req.body !== 'object') {
    return next()
  }

  try {
    // Check for potentially malicious content in the request body
    const bodyString = JSON.stringify(req.body)
    
    // Check for common XSS patterns
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
      /<form[^>]*>/gi,
      /data:text\/html/gi,
      /vbscript:/gi
    ]

    // Check if any suspicious patterns are found
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(bodyString)) {
        return respondWithError(res, 400, 'Request contains potentially malicious content')
      }
    }

    // Sanitize string fields recursively
    req.body = sanitizeObject(req.body)
    
    next()
  } catch (error) {
    return respondWithError(res, 500, 'Error processing request content')
  }
}

/**
 * Recursively sanitize object properties that are strings
 * @param {*} obj - Object to sanitize
 * @returns {*} Sanitized object
 */
function sanitizeObject(obj) {
  if (typeof obj === 'string') {
    return purify.sanitize(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item))
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }
  
  return obj
}