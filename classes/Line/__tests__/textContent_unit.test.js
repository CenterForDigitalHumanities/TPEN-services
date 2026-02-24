import Line from '../Line.js'
import { isVariantTextualBody } from '../Line.js'

describe('Line.textContent() extracts plain text from annotation bodies. #textContent_unit', () => {

  describe('isVariantTextualBody helper', () => {
    it('returns true for a plain string', () => {
      expect(isVariantTextualBody('hello')).toBe(true)
    })

    it('returns true for an object with value property', () => {
      expect(isVariantTextualBody({ type: 'TextualBody', value: 'hello' })).toBe(true)
    })

    it('returns true for an object with chars property', () => {
      expect(isVariantTextualBody({ chars: 'hello' })).toBe(true)
    })

    it('returns true for an object with cnt:asChars property', () => {
      expect(isVariantTextualBody({ 'cnt:asChars': 'hello' })).toBe(true)
    })

    it('returns false for null', () => {
      expect(isVariantTextualBody(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isVariantTextualBody(undefined)).toBe(false)
    })

    it('returns false for a non-textual object (e.g. image body)', () => {
      expect(isVariantTextualBody({ type: 'Image', id: 'http://example.com/img.jpg' })).toBe(false)
    })

    it('returns false for a number', () => {
      expect(isVariantTextualBody(42)).toBe(false)
    })
  })

  describe('textContent() with string body', () => {
    it('returns the string body directly', () => {
      const line = new Line({ id: 'test-1', body: 'Hello world', target: 'http://example.com/canvas' })
      expect(line.textContent()).toBe('Hello world')
    })

    it('returns empty string for an empty string body', () => {
      const line = new Line({ id: 'test-2', body: '', target: 'http://example.com/canvas' })
      expect(line.textContent()).toBe('')
    })
  })

  describe('textContent() with object body', () => {
    it('returns value from body.value (TextualBody)', () => {
      const line = new Line({
        id: 'test-3',
        body: { type: 'TextualBody', value: 'Transcribed text', format: 'text/plain' },
        target: 'http://example.com/canvas'
      })
      expect(line.textContent()).toBe('Transcribed text')
    })

    it('returns value from body.chars', () => {
      const line = new Line({
        id: 'test-4',
        body: { chars: 'Content via chars' },
        target: 'http://example.com/canvas'
      })
      expect(line.textContent()).toBe('Content via chars')
    })

    it('returns value from body[cnt:asChars]', () => {
      const line = new Line({
        id: 'test-5',
        body: { 'cnt:asChars': 'Content via cnt:asChars' },
        target: 'http://example.com/canvas'
      })
      expect(line.textContent()).toBe('Content via cnt:asChars')
    })

    it('returns empty string for a non-textual object body', () => {
      const line = new Line({
        id: 'test-6',
        body: { type: 'Image', id: 'http://example.com/img.jpg' },
        target: 'http://example.com/canvas'
      })
      expect(line.textContent()).toBe('')
    })
  })

  describe('textContent() with array body', () => {
    it('returns text from the first textual body in an array', () => {
      const line = new Line({
        id: 'test-7',
        body: [
          { type: 'Image', id: 'http://example.com/img.jpg' },
          { type: 'TextualBody', value: 'Found it' }
        ],
        target: 'http://example.com/canvas'
      })
      expect(line.textContent()).toBe('Found it')
    })

    it('returns text from a plain string entry in an array', () => {
      const line = new Line({
        id: 'test-8',
        body: ['First text', { type: 'Image', id: 'http://example.com/img.jpg' }],
        target: 'http://example.com/canvas'
      })
      expect(line.textContent()).toBe('First text')
    })

    it('returns empty string for an empty array body', () => {
      const line = new Line({
        id: 'test-9',
        body: [],
        target: 'http://example.com/canvas'
      })
      expect(line.textContent()).toBe('')
    })

    it('returns empty string for an array with only non-textual bodies', () => {
      const line = new Line({
        id: 'test-10',
        body: [
          { type: 'Image', id: 'http://example.com/img.jpg' },
          { type: 'Dataset', id: 'http://example.com/data.csv' }
        ],
        target: 'http://example.com/canvas'
      })
      expect(line.textContent()).toBe('')
    })

    it('returns the first textual body when multiple textual bodies exist', () => {
      const line = new Line({
        id: 'test-11',
        body: [
          { type: 'TextualBody', value: 'First' },
          { type: 'TextualBody', value: 'Second' }
        ],
        target: 'http://example.com/canvas'
      })
      expect(line.textContent()).toBe('First')
    })
  })

  describe('textContent() with null/undefined body', () => {
    it('returns empty string when body is null', () => {
      const line = new Line({ id: 'test-12', body: null, target: 'http://example.com/canvas' })
      expect(line.textContent()).toBe('')
    })

    it('returns empty string when body is undefined', () => {
      const line = new Line({ id: 'test-13', body: undefined, target: 'http://example.com/canvas' })
      expect(line.textContent()).toBe('')
    })
  })
})
