import pageRouter from '../index.js'
import express from 'express'
import request from 'supertest'
import { jest } from '@jest/globals'

/**
 * Tests for the page resolution feature (?resolve=full query parameter)
 *
 * Tests verify that:
 * 1. Default behavior returns annotation references (backwards compatibility)
 * 2. ?resolve=full resolves items to full annotation objects with bodies
 * 3. ?resolve=full resolves partOf to full AnnotationCollection
 * 4. Graceful fallback occurs when fetch fails
 * 5. Timeout handling works correctly
 * 6. Empty pages are handled properly
 */

// Mock utilities
jest.unstable_mockModule('../../utilities/shared.js', () => ({
  findPageById: jest.fn(),
  respondWithError: jest.fn((res, status, message) => {
    res.status(status).json({ error: message })
  }),
  getLayerContainingPage: jest.fn(),
  updatePageAndProject: jest.fn(),
  handleVersionConflict: jest.fn()
}))

const { findPageById, respondWithError } = await import('../../utilities/shared.js')

// Mock authentication
jest.unstable_mockModule('../../auth/index.js', () => ({
  default: jest.fn(() => (req, res, next) => {
    req.user = { _id: 'test-user-id', agent: 'http://example.org/user/test-user' }
    next()
  })
}))

const app = express()
app.use(express.json())
app.use('/project/:projectId/page', pageRouter)

// Store original fetch
const originalFetch = global.fetch

describe.skip('Page Resolution Feature (?resolve=full)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset fetch to original before each test
    global.fetch = originalFetch
  })

  afterAll(() => {
    // Restore original fetch after all tests
    global.fetch = originalFetch
  })

  describe('Backwards Compatibility (without ?resolve=full)', () => {
    it('should return annotation references without bodies (default behavior)', async () => {
      const mockPage = {
        id: 'https://devstore.rerum.io/v1/id/page123',
        type: 'AnnotationPage',
        label: 'Test Page',
        items: [
          {
            id: 'https://devstore.rerum.io/v1/id/annotation1',
            type: 'Annotation',
            target: { source: 'canvas1' }
          }
        ],
        partOf: 'https://devstore.rerum.io/v1/id/collection1',
        target: 'canvas1'
      }

      findPageById.mockResolvedValue(mockPage)

      const res = await request(app)
        .get('/project/project123/page/page123')
        .expect(200)

      expect(res.body.items).toBeDefined()
      expect(res.body.items[0]).toHaveProperty('id')
      expect(res.body.items[0]).not.toHaveProperty('body')
      expect(res.body.partOf).toBeDefined()
      expect(res.body.partOf[0]).toHaveProperty('id')
      expect(res.body.partOf[0]).not.toHaveProperty('label')
    })
  })

  describe('Full Resolution (with ?resolve=full)', () => {
    it('should resolve annotations to include body properties', async () => {
      const mockPage = {
        id: 'https://devstore.rerum.io/v1/id/page123',
        type: 'AnnotationPage',
        label: 'Test Page',
        items: [
          {
            id: 'https://devstore.rerum.io/v1/id/annotation1',
            type: 'Annotation',
            target: { source: 'canvas1' }
          }
        ],
        partOf: 'https://devstore.rerum.io/v1/id/collection1',
        target: 'canvas1'
      }

      const mockFullAnnotation = {
        id: 'https://devstore.rerum.io/v1/id/annotation1',
        type: 'Annotation',
        motivation: 'transcribing',
        target: { source: 'canvas1' },
        body: {
          type: 'TextualBody',
          value: 'Test transcription',
          format: 'text/plain'
        }
      }

      const mockFullCollection = {
        id: 'https://devstore.rerum.io/v1/id/collection1',
        type: 'AnnotationCollection',
        label: { none: ['Test Collection'] },
        total: 5
      }

      findPageById.mockResolvedValue(mockPage)

      // Mock fetch to return full objects
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFullAnnotation
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFullCollection
        })

      const res = await request(app)
        .get('/project/project123/page/page123?resolve=full')
        .expect(200)

      expect(res.body.items).toBeDefined()
      expect(res.body.items[0]).toHaveProperty('body')
      expect(res.body.items[0].body).toHaveProperty('value', 'Test transcription')

      expect(res.body.partOf).toBeDefined()
      expect(res.body.partOf[0]).toHaveProperty('label')
      expect(res.body.partOf[0]).toHaveProperty('total', 5)
    })

    it('should resolve multiple annotations in parallel', async () => {
      const mockPage = {
        id: 'https://devstore.rerum.io/v1/id/page123',
        type: 'AnnotationPage',
        label: 'Test Page',
        items: [
          { id: 'https://devstore.rerum.io/v1/id/annotation1', type: 'Annotation', target: 'canvas1' },
          { id: 'https://devstore.rerum.io/v1/id/annotation2', type: 'Annotation', target: 'canvas1' },
          { id: 'https://devstore.rerum.io/v1/id/annotation3', type: 'Annotation', target: 'canvas1' }
        ],
        partOf: 'https://devstore.rerum.io/v1/id/collection1',
        target: 'canvas1'
      }

      findPageById.mockResolvedValue(mockPage)

      const mockFetch = jest.fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            id: 'resolved',
            type: 'Annotation',
            body: { type: 'TextualBody', value: 'text' }
          })
        })

      global.fetch = mockFetch

      await request(app)
        .get('/project/project123/page/page123?resolve=full')
        .expect(200)

      // Verify fetch was called for each annotation + collection
      expect(mockFetch).toHaveBeenCalledTimes(4)
    })

    it('should handle empty items array gracefully', async () => {
      const mockPage = {
        id: 'https://devstore.rerum.io/v1/id/page123',
        type: 'AnnotationPage',
        label: 'Empty Page',
        items: [],
        partOf: 'https://devstore.rerum.io/v1/id/collection1',
        target: 'canvas1'
      }

      findPageById.mockResolvedValue(mockPage)

      const mockFetch = jest.fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            id: 'https://devstore.rerum.io/v1/id/collection1',
            type: 'AnnotationCollection'
          })
        })

      global.fetch = mockFetch

      const res = await request(app)
        .get('/project/project123/page/page123?resolve=full')
        .expect(200)

      expect(res.body.items).toEqual([])
      // Only collection should be fetched
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling and Graceful Fallback', () => {
    it('should fallback to reference when annotation fetch fails', async () => {
      const mockPage = {
        id: 'https://devstore.rerum.io/v1/id/page123',
        type: 'AnnotationPage',
        label: 'Test Page',
        items: [
          {
            id: 'https://devstore.rerum.io/v1/id/annotation1',
            type: 'Annotation',
            target: 'canvas1'
          }
        ],
        partOf: 'https://devstore.rerum.io/v1/id/collection1',
        target: 'canvas1'
      }

      findPageById.mockResolvedValue(mockPage)

      // Mock fetch to fail for annotation but succeed for collection
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'https://devstore.rerum.io/v1/id/collection1',
            type: 'AnnotationCollection',
            label: { none: ['Test'] }
          })
        })

      const res = await request(app)
        .get('/project/project123/page/page123?resolve=full')
        .expect(200)

      // Should return original reference when fetch fails
      expect(res.body.items[0]).toHaveProperty('id')
      expect(res.body.items[0]).not.toHaveProperty('body')

      // Collection should still be resolved
      expect(res.body.partOf[0]).toHaveProperty('label')
    })

    it('should fallback to reference when fetch throws error', async () => {
      const mockPage = {
        id: 'https://devstore.rerum.io/v1/id/page123',
        type: 'AnnotationPage',
        label: 'Test Page',
        items: [
          {
            id: 'https://devstore.rerum.io/v1/id/annotation1',
            type: 'Annotation',
            target: 'canvas1'
          }
        ],
        partOf: 'https://devstore.rerum.io/v1/id/collection1',
        target: 'canvas1'
      }

      findPageById.mockResolvedValue(mockPage)

      // Mock fetch to throw network error
      global.fetch = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'collection', type: 'AnnotationCollection' })
        })

      const res = await request(app)
        .get('/project/project123/page/page123?resolve=full')
        .expect(200)

      // Should return original reference when fetch throws
      expect(res.body.items[0]).toHaveProperty('id')
      expect(res.body.items[0]).not.toHaveProperty('body')
    })

    it('should handle timeout gracefully', async () => {
      const mockPage = {
        id: 'https://devstore.rerum.io/v1/id/page123',
        type: 'AnnotationPage',
        label: 'Test Page',
        items: [
          {
            id: 'https://devstore.rerum.io/v1/id/annotation1',
            type: 'Annotation',
            target: 'canvas1'
          }
        ],
        partOf: 'https://devstore.rerum.io/v1/id/collection1',
        target: 'canvas1'
      }

      findPageById.mockResolvedValue(mockPage)

      // Mock fetch to simulate timeout
      global.fetch = jest.fn().mockImplementation(() => {
        const error = new Error('The operation was aborted')
        error.name = 'AbortError'
        return Promise.reject(error)
      })

      const res = await request(app)
        .get('/project/project123/page/page123?resolve=full')
        .expect(200)

      // Should return original references when timeout occurs
      expect(res.body.items[0]).toHaveProperty('id')
      expect(res.body.items[0]).not.toHaveProperty('body')
    })

    it('should skip resolution for non-HTTP URIs', async () => {
      const mockPage = {
        id: 'https://devstore.rerum.io/v1/id/page123',
        type: 'AnnotationPage',
        label: 'Test Page',
        items: [
          {
            id: 'urn:uuid:12345',
            type: 'Annotation',
            target: 'canvas1'
          }
        ],
        partOf: 'urn:uuid:collection',
        target: 'canvas1'
      }

      findPageById.mockResolvedValue(mockPage)

      const mockFetch = jest.fn()
      global.fetch = mockFetch

      const res = await request(app)
        .get('/project/project123/page/page123?resolve=full')
        .expect(200)

      // Fetch should not be called for non-HTTP URIs
      expect(mockFetch).not.toHaveBeenCalled()
      expect(res.body.items[0].id).toBe('urn:uuid:12345')
    })
  })

  describe('Page Not Found', () => {
    it('should return 404 when page does not exist', async () => {
      findPageById.mockResolvedValue(null)

      await request(app)
        .get('/project/project123/page/nonexistent?resolve=full')
        .expect(404)
    })
  })
})
