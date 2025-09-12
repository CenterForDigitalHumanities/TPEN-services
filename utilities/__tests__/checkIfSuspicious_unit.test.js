import checkIfSuspicious from '../checkIfSuspicious.js'
import { jest } from '@jest/globals'

describe('checkIfSuspicious middleware #suspicious_unit', () => {
  let req, res, next

  beforeEach(() => {
    req = { body: {} }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }
    next = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call next() for clean request body', () => {
    req.body = { 
      label: 'My Project',
      metadata: { title: 'Test Project' }
    }

    checkIfSuspicious(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should block requests with script tags', () => {
    req.body = { 
      label: 'My Project<script>alert("xss")</script>',
      description: 'A normal description'
    }

    checkIfSuspicious(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ 
      message: 'Request contains potentially malicious content' 
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should block requests with javascript: URLs', () => {
    req.body = { 
      url: 'javascript:alert("xss")',
      label: 'My Project'
    }

    checkIfSuspicious(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ 
      message: 'Request contains potentially malicious content' 
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should block requests with event handlers', () => {
    req.body = { 
      label: 'My Project',
      metadata: { title: '<div onclick="alert(1)">Title</div>' }
    }

    checkIfSuspicious(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ 
      message: 'Request contains potentially malicious content' 
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should block requests with iframe tags', () => {
    req.body = { 
      description: '<iframe src="http://malicious.com"></iframe>'
    }

    checkIfSuspicious(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ 
      message: 'Request contains potentially malicious content' 
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should sanitize HTML content in strings', () => {
    req.body = { 
      label: '<b>My Project</b>',
      description: '<p>A description with <strong>bold</strong> text</p>'
    }

    checkIfSuspicious(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(req.body.label).toBe('<b>My Project</b>') // Safe HTML should be preserved
    expect(req.body.description).toBe('<p>A description with <strong>bold</strong> text</p>')
  })

  it('should handle nested objects and arrays', () => {
    req.body = { 
      metadata: [
        { label: 'title', value: '<b>Clean Title</b>' },
        { label: 'desc', value: 'Normal description' }
      ],
      layers: {
        layer1: { name: 'Layer Name', content: '<p>Content</p>' }
      }
    }

    checkIfSuspicious(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(req.body.metadata[0].value).toBe('<b>Clean Title</b>')
    expect(req.body.layers.layer1.content).toBe('<p>Content</p>')
  })

  it('should handle null or undefined request body', () => {
    req.body = null

    checkIfSuspicious(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should handle non-object request body', () => {
    req.body = 'string body'

    checkIfSuspicious(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should handle errors gracefully', () => {
    // Mock JSON.stringify to throw an error
    const originalStringify = JSON.stringify
    JSON.stringify = jest.fn().mockImplementation(() => {
      throw new Error('Circular reference')
    })

    req.body = { label: 'My Project' }

    checkIfSuspicious(req, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ 
      message: 'Error processing request content' 
    })
    expect(next).not.toHaveBeenCalled()

    // Restore original function
    JSON.stringify = originalStringify
  })
})