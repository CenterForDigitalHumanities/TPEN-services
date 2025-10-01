import { isSuspiciousJSON } from "../../utilities/checkIfSuspicious.js"

describe("Suspicious content detection for Line/Annotation data", () => {
  it('should detect suspicious content in annotation body - script tag', () => {
    const suspiciousAnnotation = {
      id: 'anno-1',
      body: '<script>alert("malicious")</script>',
      target: 'canvas#xywh=0,0,100,100'
    }
    
    expect(isSuspiciousJSON(suspiciousAnnotation, [], false, 1)).toBe(true)
  })

  it('should detect suspicious content in annotation body - eval function', () => {
    const suspiciousAnnotation = {
      id: 'anno-1',
      body: 'eval(malicious)',
      target: 'canvas#xywh=0,0,100,100'
    }
    
    expect(isSuspiciousJSON(suspiciousAnnotation, [], false, 1)).toBe(true)
  })

  it('should detect suspicious content in annotation body - function declaration', () => {
    const suspiciousAnnotation = {
      id: 'anno-1',
      body: 'function(){alert("bad")}',
      target: 'canvas#xywh=0,0,100,100'
    }
    
    expect(isSuspiciousJSON(suspiciousAnnotation, [], false, 1)).toBe(true)
  })

  it('should detect suspicious content in annotation body - javascript protocol', () => {
    const suspiciousAnnotation = {
      id: 'anno-1',
      body: 'javascript:alert("xss")',
      target: 'canvas#xywh=0,0,100,100'
    }
    
    expect(isSuspiciousJSON(suspiciousAnnotation, [], false, 1)).toBe(true)
  })

  it('should detect suspicious content in annotation body - SQL-like', () => {
    const suspiciousAnnotation = {
      id: 'anno-1',
      body: 'db.collection()',
      target: 'canvas#xywh=0,0,100,100'
    }
    
    expect(isSuspiciousJSON(suspiciousAnnotation, [], false, 1)).toBe(true)
  })

  it('should NOT detect suspicious content in safe annotation body', () => {
    const safeAnnotation = {
      id: 'anno-1',
      body: 'This is a normal transcription text with (parentheses) and [brackets].',
      target: 'canvas#xywh=0,0,100,100'
    }
    
    expect(isSuspiciousJSON(safeAnnotation, [], false, 1)).toBe(false)
  })

  it('should NOT detect suspicious content in safe annotation body with special chars', () => {
    const safeAnnotation = {
      id: 'anno-1',
      body: 'Text with special chars: $100, #hashtag, @mention, 50% complete!',
      target: 'canvas#xywh=0,0,100,100'
    }
    
    expect(isSuspiciousJSON(safeAnnotation, [], false, 1)).toBe(false)
  })

  it('should detect suspicious content in array of annotations', () => {
    const annotations = [
      {
        id: 'anno-1',
        body: 'This is fine',
        target: 'canvas#xywh=0,0,100,100'
      },
      {
        id: 'anno-2',
        body: '<script>alert("bad")</script>',
        target: 'canvas#xywh=0,100,100,100'
      }
    ]

    // Check each annotation like the route does
    const hasSuspicious = annotations.some(anno => isSuspiciousJSON(anno, [], false, 1))
    expect(hasSuspicious).toBe(true)
  })

  it('should NOT detect suspicious content in array of safe annotations', () => {
    const annotations = [
      {
        id: 'anno-1',
        body: 'First line of text',
        target: 'canvas#xywh=0,0,100,100'
      },
      {
        id: 'anno-2',
        body: 'Second line of text',
        target: 'canvas#xywh=0,100,100,100'
      }
    ]

    // Check each annotation like the route does
    const hasSuspicious = annotations.some(anno => isSuspiciousJSON(anno, [], false, 1))
    expect(hasSuspicious).toBe(false)
  })
})

