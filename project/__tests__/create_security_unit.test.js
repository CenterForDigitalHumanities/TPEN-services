import request from 'supertest'
import express from 'express'
import { jest } from '@jest/globals'

// Mock all dependencies before importing the router
jest.mock('../../auth/index.js', () => {
  return function() {
    return (req, res, next) => {
      req.user = { _id: 'test-user-id', agent: 'test-agent' }
      next()
    }
  }
})

jest.mock('../../classes/Project/Project.js', () => {
  return class MockProject {
    async create(project) {
      if (project.malicious) {
        throw new Error('Test error')
      }
      return { ...project, _id: 'test-project-id' }
    }
  }
})

// Mock other classes that might be imported
jest.mock('../../classes/Project/ProjectFactory.js', () => ({}))
jest.mock('../../classes/Layer/Layer.js', () => ({}))
jest.mock('../../classes/Page/Page.js', () => ({}))
jest.mock('../../classes/Group/Group.js', () => ({}))
jest.mock('../../classes/HotKeys/Hotkeys.js', () => ({}))
jest.mock('../../utilities/validateEmail.js', () => ({ isValidEmail: () => true }))
jest.mock('../../utilities/isDefaultRole.js', () => () => ({}))
jest.mock('../../utilities/validateURL.js', () => () => ({ valid: true }))
jest.mock('../../layer/index.js', () => ({ default: express.Router() }))
jest.mock('../../page/index.js', () => ({ default: express.Router() }))

// Now import the router after mocks are set up
const projectRouter = await import('../index.js')

const app = express()
app.use(express.json())
app.use('/project', projectRouter.default)

describe('Project create route with checkIfSuspicious middleware #project_create_security_unit', () => {
  it('should accept clean project data', async () => {
    const cleanProject = {
      label: 'My Test Project',
      metadata: { title: 'Clean Title' },
      layers: [],
      manifest: 'https://example.com/manifest',
      creator: 'test-user',
      group: 'test-group'
    }

    const response = await request(app)
      .post('/project/create')
      .send(cleanProject)

    expect(response.status).toBe(201)
    expect(response.body.label).toBe('My Test Project')
  })

  it('should block project data with XSS script tags', async () => {
    const maliciousProject = {
      label: 'My Project<script>alert("xss")</script>',
      metadata: { title: 'Clean Title' },
      layers: [],
      manifest: 'https://example.com/manifest',
      creator: 'test-user',
      group: 'test-group'
    }

    const response = await request(app)
      .post('/project/create')
      .send(maliciousProject)

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Request contains potentially malicious content')
  })

  it('should block project data with javascript URLs', async () => {
    const maliciousProject = {
      label: 'My Project',
      metadata: { url: 'javascript:alert("xss")' },
      layers: [],
      manifest: 'https://example.com/manifest',
      creator: 'test-user',
      group: 'test-group'
    }

    const response = await request(app)
      .post('/project/create')
      .send(maliciousProject)

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Request contains potentially malicious content')
  })

  it('should block project data with event handlers', async () => {
    const maliciousProject = {
      label: 'My Project',
      metadata: { title: '<div onclick="alert(1)">Title</div>' },
      layers: [],
      manifest: 'https://example.com/manifest',
      creator: 'test-user',
      group: 'test-group'
    }

    const response = await request(app)
      .post('/project/create')
      .send(maliciousProject)

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Request contains potentially malicious content')
  })

  it('should sanitize safe HTML in project data', async () => {
    const projectWithHTML = {
      label: '<b>My Bold Project</b>',
      metadata: { description: '<p>A description with <em>emphasis</em></p>' },
      layers: [],
      manifest: 'https://example.com/manifest',
      creator: 'test-user',
      group: 'test-group'
    }

    const response = await request(app)
      .post('/project/create')
      .send(projectWithHTML)

    expect(response.status).toBe(201)
    expect(response.body.label).toBe('<b>My Bold Project</b>')
    expect(response.body.metadata.description).toBe('<p>A description with <em>emphasis</em></p>')
  })
})