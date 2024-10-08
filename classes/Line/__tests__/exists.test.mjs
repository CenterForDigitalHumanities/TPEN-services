import { Line } from "../Line.mjs"

describe('Line Class looks how we expect it to. #Line_exists_unit', () => {
  it('Imports Line', () => {
    expect(Line.constructor).toBeInstanceOf(Function)
  })

  const line = new Line()

  it('has useful methods', () => {
    expect(line.asJSON).toBeInstanceOf(Function)
    expect(line.create).toBeInstanceOf(Function)
    expect(line.delete).toBeInstanceOf(Function)
    expect(line.save).toBeInstanceOf(Function)
    expect(line.getParentPage).toBeInstanceOf(Function)
    expect(line.getPreviousLine).toBeInstanceOf(Function)
    expect(line.getNextLine).toBeInstanceOf(Function)
    expect(line.getParentCollection).toBeInstanceOf(Function) 
    expect(line.embedReferencedDocuments).toBeInstanceOf(Function)
    expect(line.fetchMetadata).toBeInstanceOf(Function)
    expect(line.asHTML).toBeInstanceOf(Function) 
    expect(line.update).toBeInstanceOf(Function) 
    expect(line.setTextContent).toBeInstanceOf(Function)
    expect(line.setImageLink).toBeInstanceOf(Function)
  })

  it('configures a correct Annotation', () => {
    expect(line.id).toBeDefined()
    const json = line.asJSON()
    expect(json).toBeInstanceOf(Object)
    expect(json.type).toBe('Annotation')
    expect(json['@context']).toBe("http://www.w3.org/ns/anno.jsonld")
    expect(json.body).toBeDefined()
    expect(json.target).toBeDefined()
  })
})
