// Tests for shared utility functions

import { jest } from '@jest/globals'

// Mock fetch globally
global.fetch = jest.fn()

const mockFetch = global.fetch

// Import the functions we want to test
const { fetchAnnotationFromRerum, resolveAnnotations } = await import('../utilities/shared.js')

describe('fetchAnnotationFromRerum', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.RERUMIDPREFIX = 'https://devstore.rerum.io/v1/id/'
  })

  it('should fetch annotation from RERUM with proper ID format', async () => {
    const mockAnnotation = {
      id: 'https://devstore.rerum.io/v1/id/test-annotation-id',
      type: 'Annotation',
      body: [{ type: 'TextualBody', value: 'Test transcription' }]
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnnotation
    })

    const result = await fetchAnnotationFromRerum('test-annotation-id')

    expect(result).toEqual(mockAnnotation)
    expect(mockFetch).toHaveBeenCalledWith('https://devstore.rerum.io/v1/id/test-annotation-id')
  })

  it('should handle full RERUM URLs correctly', async () => {
    const mockAnnotation = {
      id: 'https://devstore.rerum.io/v1/id/full-url-id',
      type: 'Annotation'
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnnotation
    })

    const result = await fetchAnnotationFromRerum('https://devstore.rerum.io/v1/id/full-url-id')

    expect(result).toEqual(mockAnnotation)
    expect(mockFetch).toHaveBeenCalledWith('https://devstore.rerum.io/v1/id/full-url-id')
  })

  it('should return null when annotation is not found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({})
    })

    const result = await fetchAnnotationFromRerum('nonexistent-id')

    expect(result).toBeNull()
  })

  it('should return null when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await fetchAnnotationFromRerum('test-id')

    expect(result).toBeNull()
  })

  it('should return null for invalid input', async () => {
    const result = await fetchAnnotationFromRerum(null)

    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

describe('resolveAnnotations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.RERUMIDPREFIX = 'https://devstore.rerum.io/v1/id/'
  })

  it('should resolve all annotations in parallel', async () => {
    const mockItems = [
      { id: 'annotation1', type: 'Annotation' },
      { id: 'annotation2', type: 'Annotation' }
    ]

    const mockResolvedAnnotations = [
      {
        id: 'https://devstore.rerum.io/v1/id/annotation1',
        type: 'Annotation',
        body: [{ type: 'TextualBody', value: 'Text 1' }]
      },
      {
        id: 'https://devstore.rerum.io/v1/id/annotation2',
        type: 'Annotation',
        body: [{ type: 'TextualBody', value: 'Text 2' }]
      }
    ]

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResolvedAnnotations[0]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResolvedAnnotations[1]
      })

    const result = await resolveAnnotations(mockItems)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(expect.objectContaining(mockResolvedAnnotations[0]))
    expect(result[1]).toEqual(expect.objectContaining(mockResolvedAnnotations[1]))
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('should handle already resolved items correctly', async () => {
    const mockItems = [
      { id: 'annotation1', type: 'Annotation' }, // needs resolution
      { id: 'annotation2', type: 'Annotation', body: [{ value: 'Already resolved' }] } // already resolved
    ]

    const mockResolvedAnnotation = {
      id: 'https://devstore.rerum.io/v1/id/annotation1',
      type: 'Annotation',
      body: [{ type: 'TextualBody', value: 'Resolved text' }]
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResolvedAnnotation
    })

    const result = await resolveAnnotations(mockItems)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(expect.objectContaining(mockResolvedAnnotation))
    expect(result[1]).toEqual(mockItems[1]) // unchanged
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('should return original items when resolution fails', async () => {
    const mockItems = [
      { id: 'annotation1', type: 'Annotation' },
      { id: 'annotation2', type: 'Annotation' }
    ]

    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'https://devstore.rerum.io/v1/id/annotation2',
          type: 'Annotation',
          body: [{ type: 'TextualBody', value: 'Text 2' }]
        })
      })

    const result = await resolveAnnotations(mockItems)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(mockItems[0]) // original when resolution failed
    expect(result[1].body).toEqual([{ type: 'TextualBody', value: 'Text 2' }])
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('should handle empty items array', async () => {
    const result = await resolveAnnotations([])

    expect(result).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should handle null or undefined items', async () => {
    const result1 = await resolveAnnotations(null)
    const result2 = await resolveAnnotations(undefined)

    expect(result1).toEqual([])
    expect(result2).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should handle items without IDs', async () => {
    const mockItems = [
      { type: 'Annotation' }, // no id
      { id: 'annotation2', type: 'Annotation' }
    ]

    const mockResolvedAnnotation = {
      id: 'https://devstore.rerum.io/v1/id/annotation2',
      type: 'Annotation',
      body: [{ type: 'TextualBody', value: 'Text 2' }]
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResolvedAnnotation
    })

    const result = await resolveAnnotations(mockItems)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(mockItems[0]) // unchanged (no id to resolve)
    expect(result[1]).toEqual(expect.objectContaining(mockResolvedAnnotation))
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})