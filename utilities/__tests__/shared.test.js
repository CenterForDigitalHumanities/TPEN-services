import { hasAnnotationChanges } from "../shared.js"

describe("hasAnnotationChanges - Annotation change detection utility. #shared_unit", () => {

  describe("Body changes", () => {
    it('returns true when body changes (string)', () => {
      const existing = { body: 'old text', target: 'canvas#xywh=0,0,100,100' }
      const incoming = { body: 'new text', target: 'canvas#xywh=0,0,100,100' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(true)
    })

    it('returns true when body changes (TextualBody object)', () => {
      const existing = { body: { type: 'TextualBody', value: 'old' }, target: 'canvas' }
      const incoming = { body: { type: 'TextualBody', value: 'new' }, target: 'canvas' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(true)
    })

    it('returns true when body type changes (string to object)', () => {
      const existing = { body: 'old text', target: 'canvas' }
      const incoming = { body: { type: 'TextualBody', value: 'old text' }, target: 'canvas' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(true)
    })

    it('returns true when body changes (array format)', () => {
      const existing = { body: [{ type: 'TextualBody', value: 'old' }], target: 'canvas' }
      const incoming = { body: [{ type: 'TextualBody', value: 'new' }], target: 'canvas' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(true)
    })
  })

  describe("Target changes", () => {
    it('returns true when target changes (string)', () => {
      const existing = { body: 'text', target: 'canvas#xywh=0,0,100,100' }
      const incoming = { body: 'text', target: 'canvas#xywh=50,50,200,200' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(true)
    })

    it('returns true when target changes (SpecificResource object)', () => {
      const existing = {
        body: 'text',
        target: { source: 'canvas', selector: { type: 'FragmentSelector', value: 'xywh=0,0,100,100' } }
      }
      const incoming = {
        body: 'text',
        target: { source: 'canvas', selector: { type: 'FragmentSelector', value: 'xywh=10,10,200,200' } }
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

    it('returns false when only non-content fields differ', () => {
      const existing = { id: 'old-id', body: 'text', target: 'canvas', motivation: 'transcribing', creator: 'userA', '@context': 'http://iiif.io/api/presentation/3/context.json' }
      const incoming = { id: 'new-id', body: 'text', target: 'canvas', motivation: 'commenting', creator: 'userB', '@context': 'http://www.w3.org/ns/anno.jsonld' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(false)
    })
  })

  describe("Edge cases", () => {
    it('handles null body gracefully', () => {
      const existing = { body: null, target: 'canvas' }
      const incoming = { body: null, target: 'canvas' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(false)
    })

    it('returns true when body changes from null to value', () => {
      const existing = { body: null, target: 'canvas' }
      const incoming = { body: 'new text', target: 'canvas' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(true)
    })

    it('ignores extra RERUM metadata fields', () => {
      const existing = { body: 'text', target: 'canvas', __rerum: { isOverwritten: 'some-date' } }
      const incoming = { body: 'text', target: 'canvas' }
      expect(hasAnnotationChanges(existing, incoming)).toBe(false)
    })
  })
})
