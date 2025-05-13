import Line from '../Line.js'

describe.skip('Line class unit tests', () => {
  it('should throw an error if no ID, body, or target is provided', () => {
    expect(() => new Line({})).toThrow('Line data is malformed.')
  })

  it('should create a new Line instance with valid data', () => {
    const line = new Line({ id: '123', body: 'Sample text', target: 'https://example.com?xywh=10,10,100,100' })
    expect(line.id).toBe('123')
    expect(line.body).toBe('Sample text')
    expect(line.target).toBe('https://example.com?xywh=10,10,100,100')
  })

  it('should save a line to RERUM', async () => {
    const line = new Line({ id: '123', body: 'Sample text', target: 'https://example.com?xywh=10,10,100,100' })
    const savedLine = await line.update()
    expect(savedLine.id).toBeDefined()
  })

  it('should update the text of a line', async () => {
    const line = new Line({ id: '123', body: 'Old text', target: 'https://example.com?xywh=10,10,100,100' })
    const updatedLine = await line.updateText('New text')
    expect(updatedLine.body).toBe('New text')
  })

  it('should not update the text if it is the same', async () => {
    const line = new Line({ id: '123', body: 'Same text', target: 'https://example.com?xywh=10,10,100,100' })
    const updatedLine = await line.updateText('Same text')
    expect(updatedLine.body).toBe('Same text')
  })

  it('should update the bounds of a line', async () => {
    const line = new Line({ id: '123', body: 'Sample text', target: 'https://example.com?xywh=10,10,100,100' })
    const updatedLine = await line.updateBounds({ x: 20, y: 20, w: 200, h: 200 })
    expect(updatedLine.target).toBe('https://example.com?xywh=20,20,200,200')
  })

  it('should not update the bounds if they are the same', async () => {
    const line = new Line({ id: '123', body: 'Sample text', target: 'https://example.com?xywh=10,10,100,100' })
    const updatedLine = await line.updateBounds({ x: 10, y: 10, w: 100, h: 100 })
    expect(updatedLine.target).toBe('https://example.com?xywh=10,10,100,100')
  })

  it('should return JSON-LD format when isLD is true', () => {
    const line = new Line({ id: '123', body: 'Sample text', target: 'https://example.com?xywh=10,10,100,100' })
    const jsonLD = line.asJSON(true)
    expect(jsonLD).toEqual({
      '@context': 'http://iiif.io/api/presentation/3/context.json',
      id: '123',
      type: 'Annotation',
      motivation: 'transcribing',
      target: 'https://example.com?xywh=10,10,100,100',
      body: 'Sample text'
    })
  })

  it('should return plain JSON format when isLD is false', () => {
    const line = new Line({ id: '123', body: 'Sample text', target: 'https://example.com?xywh=10,10,100,100' })
    const json = line.asJSON(false)
    expect(json).toEqual({
        id: '123',
      body: 'Sample text',
      target: 'https://example.com?xywh=10,10,100,100'
    })
  })

  it('should delete a line', async () => {
    const line = new Line({ id: '123', body: 'Sample text', target: 'https://example.com?xywh=10,10,100,100' })
    const result = await line.delete()
    expect(result).toBe(true)
  })
})
