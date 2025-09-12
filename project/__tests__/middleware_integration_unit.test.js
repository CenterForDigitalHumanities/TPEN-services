import checkIfSuspicious from '../../utilities/checkIfSuspicious.js'
import { jest } from '@jest/globals'

describe('checkIfSuspicious middleware integration #project_security_integration_unit', () => {
  let req, res, next

  beforeEach(() => {
    req = { 
      body: {},
      user: { _id: 'test-user', agent: 'test-agent' }
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }
    next = jest.fn()
  })

  it('should be a function that can be used as middleware', () => {
    expect(typeof checkIfSuspicious).toBe('function')
    expect(checkIfSuspicious.length).toBe(3) // req, res, next
  })

  it('should allow clean project creation data to pass through', () => {
    req.body = {
      label: 'My New Project',
      metadata: [
        { label: 'title', value: 'Project Title' },
        { label: 'description', value: 'A clean description' }
      ],
      layers: [],
      manifest: 'https://example.com/manifest.json',
      creator: 'test-user',
      group: 'test-group'
    }

    checkIfSuspicious(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
    expect(req.body.label).toBe('My New Project')
  })

  it('should reject project data with XSS in label', () => {
    req.body = {
      label: 'Project<script>alert("xss")</script>',
      metadata: [],
      layers: [],
      manifest: 'https://example.com/manifest.json'
    }

    checkIfSuspicious(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Request contains potentially malicious content'
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should reject project data with XSS in metadata', () => {
    req.body = {
      label: 'Clean Project',
      metadata: [
        { label: 'title', value: '<iframe src="javascript:alert(1)"></iframe>' }
      ],
      layers: [],
      manifest: 'https://example.com/manifest.json'
    }

    checkIfSuspicious(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Request contains potentially malicious content'
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should sanitize safe HTML while preserving structure', () => {
    req.body = {
      label: '<b>Bold Project Title</b>',
      metadata: [
        { label: 'description', value: '<p>A paragraph with <em>emphasis</em></p>' }
      ],
      layers: [],
      manifest: 'https://example.com/manifest.json'
    }

    checkIfSuspicious(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(req.body.label).toBe('<b>Bold Project Title</b>')
    expect(req.body.metadata[0].value).toBe('<p>A paragraph with <em>emphasis</em></p>')
  })
})