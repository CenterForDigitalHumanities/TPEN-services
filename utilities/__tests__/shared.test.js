import { hasAnnotationChanges } from "../shared.js"

describe("hasAnnotationChanges - Annotation change detection utility. #shared_unit", () => {

  describe("Body changes", () => {
    it('returns true when body changes (string to different string)', () => {
      const existing = { body: 'old text', target: 'canvas#xywh=0,0,100,100' }
      const incoming = { body: 'new text', target: 'canvas#xywh=0,0,100,100' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(true)
    })

    it('returns true when body changes (TextualBody object)', () => {
      const existing = { body: { type: 'TextualBody', value: 'old' }, target: 'canvas' }
      const incoming = { body: { type: 'TextualBody', value: 'new' }, target: 'canvas' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(true)
    })

    it('returns true when body changes from string to object', () => {
      const existing = { body: 'old text', target: 'canvas' }
      const incoming = { body: { type: 'TextualBody', value: 'old text' }, target: 'canvas' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(true)
    })

    it('returns true when body changes in array format', () => {
      const existing = {
        body: [{ type: 'TextualBody', value: 'old' }],
        target: 'canvas'
      }
      const incoming = {
        body: [{ type: 'TextualBody', value: 'new' }],
        target: 'canvas'
      }
      expect(hasAnnotationChanges(existing, incoming)).toBe(true)
    })

    it('returns true when body array length changes', () => {
      const existing = {
        body: [{ type: 'TextualBody', value: 'text' }],
        target: 'canvas'
      }
      const incoming = {
        body: [
          { type: 'TextualBody', value: 'text' },
          { type: 'TextualBody', value: 'second' }
        ],
        target: 'canvas'
      }
      expect(hasAnnotationChanges(existing, incoming)).toBe(true)
    })
  })

  describe("Target changes", () => {
    it('returns true when target changes (fragment selector)', () => {
      const existing = { body: 'text', target: 'canvas#xywh=0,0,100,100' }
      const incoming = { body: 'text', target: 'canvas#xywh=50,50,200,200' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(true)
    })

    it('returns true when target source changes', () => {
      const existing = { body: 'text', target: 'canvas1#xywh=0,0,100,100' }
      const incoming = { body: 'text', target: 'canvas2#xywh=0,0,100,100' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(true)
    })

    it('returns true when target changes (SpecificResource object)', () => {
      const existing = {
        body: 'text',
        target: {
          source: 'canvas',
          selector: { type: 'FragmentSelector', value: 'xywh=0,0,100,100' }
        }
      }
      const incoming = {
        body: 'text',
        target: {
          source: 'canvas',
          selector: { type: 'FragmentSelector', value: 'xywh=10,10,200,200' }
        }
      }
      expect(hasAnnotationChanges(existing, incoming)).toBe(true)
    })
  })

  describe("No changes detected", () => {
    it('returns false when body and target are identical (strings)', () => {
      const existing = { body: 'text', target: 'canvas#xywh=0,0,100,100' }
      const incoming = { body: 'text', target: 'canvas#xywh=0,0,100,100' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(false)
    })

    it('returns false when body and target are identical (objects)', () => {
      const existing = {
        body: { type: 'TextualBody', value: 'text', format: 'text/plain' },
        target: { source: 'canvas', selector: { type: 'FragmentSelector', value: 'xywh=0,0,100,100' } }
      }
      const incoming = {
        body: { type: 'TextualBody', value: 'text', format: 'text/plain' },
        target: { source: 'canvas', selector: { type: 'FragmentSelector', value: 'xywh=0,0,100,100' } }
      }
      expect(hasAnnotationChanges(existing, incoming)).toBe(false)
    })

    it('returns false when only non-content fields differ (motivation)', () => {
      const existing = { body: 'text', target: 'canvas', motivation: 'transcribing' }
      const incoming = { body: 'text', target: 'canvas', motivation: 'commenting' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(false)
    })

    it('returns false when only non-content fields differ (creator)', () => {
      const existing = { body: 'text', target: 'canvas', creator: 'userA' }
      const incoming = { body: 'text', target: 'canvas', creator: 'userB' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(false)
    })

    it('returns false when only non-content fields differ (id)', () => {
      const existing = { id: 'old-id', body: 'text', target: 'canvas' }
      const incoming = { id: 'new-id', body: 'text', target: 'canvas' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(false)
    })

    it('returns false when only @context differs', () => {
      const existing = { '@context': 'http://iiif.io/api/presentation/3/context.json', body: 'text', target: 'canvas' }
      const incoming = { '@context': 'http://www.w3.org/ns/anno.jsonld', body: 'text', target: 'canvas' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(false)
    })

    it('returns false when only type differs', () => {
      const existing = { type: 'Annotation', body: 'text', target: 'canvas' }
      const incoming = { type: 'oa:Annotation', body: 'text', target: 'canvas' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(false)
    })

    it('returns false when only label differs', () => {
      const existing = { label: { none: ['Old Label'] }, body: 'text', target: 'canvas' }
      const incoming = { label: { none: ['New Label'] }, body: 'text', target: 'canvas' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(false)
    })
  })

  describe("Edge cases", () => {
    it('handles complex SpecificResource target objects', () => {
      const target = {
        source: 'canvas',
        selector: {
          type: 'FragmentSelector',
          value: 'xywh=0,0,100,100',
          conformsTo: 'http://www.w3.org/TR/media-frags/'
        }
      }
      const existing = { body: 'text', target }
      const incoming = { body: 'text', target }
      expect(hasAnnotationChanges(existing, incoming)).toBe(false)
    })

    it('handles null/undefined body gracefully', () => {
      const existing = { body: null, target: 'canvas' }
      const incoming = { body: null, target: 'canvas' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(false)
    })

    it('returns true when body changes from null to value', () => {
      const existing = { body: null, target: 'canvas' }
      const incoming = { body: 'new text', target: 'canvas' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(true)
    })

    it('handles undefined body gracefully', () => {
      const existing = { target: 'canvas' }
      const incoming = { target: 'canvas' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(false)
    })

    it('returns true when body changes from undefined to value', () => {
      const existing = { target: 'canvas' }
      const incoming = { body: 'new text', target: 'canvas' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(true)
    })

    it('handles empty string body correctly', () => {
      const existing = { body: '', target: 'canvas' }
      const incoming = { body: '', target: 'canvas' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(false)
    })

    it('returns true when empty string changes to text', () => {
      const existing = { body: '', target: 'canvas' }
      const incoming = { body: 'text', target: 'canvas' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(true)
    })

    it('handles objects with extra RERUM metadata fields', () => {
      const existing = {
        body: 'text',
        target: 'canvas',
        __rerum: { isOverwritten: 'some-date' }
      }
      const incoming = {
        body: 'text',
        target: 'canvas'
      }
      expect(hasAnnotationChanges(existing, incoming)).toBe(false)
    })
  })
})
