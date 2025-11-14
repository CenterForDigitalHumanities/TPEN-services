// Tests for the resolved page endpoint

import app from '../app.js'
import request from 'supertest'
import { jest } from '@jest/globals'

// Mock the shared utilities - need to mock the entire module
const mockFindPageById = jest.fn()
const mockResolveAnnotations = jest.fn()
const mockRespondWithError = jest.fn()

jest.unstable_mockModule('../utilities/shared.js', () => ({
  findPageById: mockFindPageById,
  respondWithError: mockRespondWithError,
  resolveAnnotations: mockResolveAnnotations
}))

// Import mocked modules
await import('../utilities/shared.js')

describe('GET /project/:projectId/page/:pageId/resolved', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set up default mock for respondWithError
    mockRespondWithError.mockImplementation((res, status, message) => {
      return res.status(status).json({ message })
    })
  })

  it('should return a resolved page with full annotation data', async () => {
    const mockPage = {
      id: 'https://devstore.rerum.io/v1/id/test-page-id',
      label: 'Test Page',
      target: 'https://example.com/canvas.json',
      partOf: 'https://example.com/layer.json',
      items: [
        { id: 'http://localhost:3001/v1/id/annotation1', type: 'Annotation' },
        { id: 'http://localhost:3001/v1/id/annotation2', type: 'Annotation' }
      ],
      prev: null,
      next: null
    }

    const mockResolvedItems = [
      {
        id: 'http://localhost:3001/v1/id/annotation1',
        type: 'Annotation',
        body: [{ type: 'TextualBody', value: 'Transcription text 1' }],
        target: { source: 'https://example.com/canvas.json' }
      },
      {
        id: 'http://localhost:3001/v1/id/annotation2',
        type: 'Annotation',
        body: [{ type: 'TextualBody', value: 'Transcription text 2' }],
        target: { source: 'https://example.com/canvas.json' }
      }
    ]

    mockFindPageById.mockResolvedValue(mockPage)
    mockResolveAnnotations.mockResolvedValue(mockResolvedItems)

    const response = await request(app)
      .get('/project/test-project-id/page/test-page-id/resolved')
      .set('Authorization', 'Bearer test-token')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      '@context': 'http://www.w3.org/ns/anno.jsonld',
      type: 'AnnotationPage',
      id: mockPage.id,
      label: { none: [mockPage.label] },
      target: mockPage.target,
      partOf: [{ id: mockPage.partOf, type: 'AnnotationCollection' }],
      prev: null,
      next: null
    })
    
    expect(response.body.items).toEqual(mockResolvedItems)
    expect(mockFindPageById).toHaveBeenCalledWith('test-page-id', 'test-project-id', true)
    expect(mockResolveAnnotations).toHaveBeenCalledWith(mockPage.items)
  })

  it('should return 404 when page is not found', async () => {
    mockFindPageById.mockResolvedValue(null)

    const response = await request(app)
      .get('/project/test-project-id/page/nonexistent-page/resolved')
      .set('Authorization', 'Bearer test-token')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ message: 'No page found with that ID.' })
  })

  it('should handle RERUM pages correctly', async () => {
    const mockRerumPage = {
      id: 'https://devstore.rerum.io/v1/id/test-rerum-page',
      label: 'RERUM Page',
      target: 'https://example.com/canvas.json',
      partOf: 'https://example.com/layer.json',
      items: [
        { id: 'http://localhost:3001/v1/id/rerum-annotation1', type: 'Annotation' }
      ],
      prev: null,
      next: null
    }

    const mockResolvedItems = [
      {
        id: 'http://localhost:3001/v1/id/rerum-annotation1',
        type: 'Annotation',
        body: [{ type: 'TextualBody', value: 'RERUM transcription text' }]
      }
    ]

    mockFindPageById.mockResolvedValue(mockRerumPage)
    mockResolveAnnotations.mockResolvedValue(mockResolvedItems)

    const response = await request(app)
      .get('/project/test-project-id/page/test-rerum-page/resolved')
      .set('Authorization', 'Bearer test-token')

    expect(response.status).toBe(200)
    expect(response.body.items).toEqual(mockResolvedItems)
    expect(mockResolveAnnotations).toHaveBeenCalledWith(mockRerumPage.items)
  })

  it('should handle empty items array', async () => {
    const mockPage = {
      id: 'https://devstore.rerum.io/v1/id/test-page-id',
      label: 'Test Page',
      target: 'https://example.com/canvas.json',
      partOf: 'https://example.com/layer.json',
      items: [],
      prev: null,
      next: null
    }

    mockFindPageById.mockResolvedValue(mockPage)
    mockResolveAnnotations.mockResolvedValue([])

    const response = await request(app)
      .get('/project/test-project-id/page/test-page-id/resolved')
      .set('Authorization', 'Bearer test-token')

    expect(response.status).toBe(200)
    expect(response.body.items).toEqual([])
    expect(mockResolveAnnotations).toHaveBeenCalledWith([])
  })

  it('should handle internal server errors gracefully', async () => {
    mockFindPageById.mockRejectedValue(new Error('Database connection failed'))

    const response = await request(app)
      .get('/project/test-project-id/page/test-page-id/resolved')
      .set('Authorization', 'Bearer test-token')

    expect(response.status).toBe(500)
    expect(response.body).toEqual({ message: 'Database connection failed' })
  })

  it('should handle resolveAnnotations errors gracefully', async () => {
    const mockPage = {
      id: 'https://devstore.rerum.io/v1/id/test-page-id',
      label: 'Test Page',
      target: 'https://example.com/canvas.json',
      partOf: 'https://example.com/layer.json',
      items: [{ id: 'annotation1', type: 'Annotation' }],
      prev: null,
      next: null
    }

    mockFindPageById.mockResolvedValue(mockPage)
    mockResolveAnnotations.mockRejectedValue(new Error('Annotation resolution failed'))

    const response = await request(app)
      .get('/project/test-project-id/page/test-page-id/resolved')
      .set('Authorization', 'Bearer test-token')

    expect(response.status).toBe(500)
    expect(response.body).toEqual({ message: 'Annotation resolution failed' })
  })

  it('should reject non-GET methods', async () => {
    const response = await request(app)
      .post('/project/test-project-id/page/test-page-id/resolved')
      .set('Authorization', 'Bearer test-token')

    expect(response.status).toBe(405)
    expect(response.body).toEqual({ message: 'Improper request method, please use GET.' })
  })
})