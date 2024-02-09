import '../Line.mjs'

describe('Line Class looks how we expect it to. #Line_exists_unit', () => {
  it('Imports Line', () => {
    expect(Line).toBeDefined()
  })

  const line = new Line()

  it('generates a correct new Line', () => {
    expect(line.id).toBeDefined()
    const json = line.asJSON()
    expect(json).toBeInstanceOf(Object)
    expect(json.type).toBe('Annotation')
    expect(json['@context'].toBe("http://www.w3.org/ns/anno.jsonld"))
    expect(json.body).toBeDefined()
    expect(json.target).toBeDefined()
  })

  it('has useful methods',()=>{
    expect(line.asJSON).toBeInstanceOf(Function)
    expect(line.create).toBeInstanceOf(Function)
    expect(line.delete).toBeInstanceOf(Function)
    expect(line.update).toBeInstanceOf(Function)
  })
})
