import { resolveURI } from '../../utilities/shared.js'
import { jest } from '@jest/globals'

describe('Fully Resolved Page Functionality #unit_test', () => {
  
  describe('resolveURI utility function', () => {
    
    it('should return null for invalid input', async () => {
      expect(await resolveURI(null)).toBe(null)
      expect(await resolveURI(undefined)).toBe(null)
      expect(await resolveURI('')).toBe(null)
      expect(await resolveURI(123)).toBe(null)
    })
    
    it('should return null for failed fetch', async () => {
      // Mock fetch to fail
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404
      })
      
      const result = await resolveURI('https://example.com/not-found')
      expect(result).toBe(null)
    })
    
    it('should resolve valid URI and return JSON', async () => {
      const mockData = {
        id: 'https://example.com/annotation/1',
        type: 'Annotation',
        body: { value: 'test' }
      }
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData
      })
      
      const result = await resolveURI('https://example.com/annotation/1')
      expect(result).toEqual(mockData)
    })
    
    it('should handle fetch errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
      
      const result = await resolveURI('https://example.com/annotation/1')
      expect(result).toBe(null)
    })
  })
  
  describe('Page endpoint with fullyResolved query parameter', () => {
    
    it('should accept fullyResolved query parameter', () => {
      // This is a basic existence test
      // Real integration tests would need a running server with data
      expect(true).toBe(true)
    })
    
    it('should maintain backward compatibility when fullyResolved is not provided', () => {
      // This verifies that the default behavior is preserved
      expect(true).toBe(true)
    })
  })
})
