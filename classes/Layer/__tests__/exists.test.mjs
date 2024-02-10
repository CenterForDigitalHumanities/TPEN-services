import { Layer } from "../Layer.mjs"

describe('Layer Class looks how we expect it to. #Layer_exists_unit', () => {
  it('Imports Layer', () => {
    expect(Layer.constructor).toBeInstanceOf(Function)
  })

  const layer = new Layer()

  it('has useful methods', () => {
    expect(layer.asJSON).toBeInstanceOf(Function)
    expect(layer.create).toBeInstanceOf(Function)
    expect(layer.remove).toBeInstanceOf(Function)
    expect(layer.save).toBeInstanceOf(Function)
    expect(layer.fetch).toBeInstanceOf(Function)
  })

  it('configures a correct Annotation', () => {
    expect(layer.id).toBeDefined()
    const json = layer.asJSON()
    expect(json).toBeInstanceOf(Object)
    expect(json.type).toBe('Range')
    expect(json['@context']).toBe("http://www.w3.org/ns/anno.jsonld")
    expect(json.items).toBeInstanceOf(Array)
    expect(json.target).toBeDefined()
  })
})
