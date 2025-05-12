import Layer from "../Layer.js"

describe('Layer Class looks how we expect it to. #Layer_exists_unit', () => {
  it('Imports Layer', () => {
    expect(typeof Layer).toBe('function')
  })

  const layer = new Layer("projectID", { id: "layerID", label: "Layer Label", pages: [{ id: "pageID", label: "Page Label", target: "https://example.com/canvas" }] })
  
  it('has useful methods', () => {
    expect(typeof layer.update).toBe('function')
    expect(typeof layer.delete).toBe('function')
  })

  it('has expected properties', () => {
    expect(layer).toHaveProperty('id')
    expect(layer).toHaveProperty('label')
    expect(layer).toHaveProperty('pages')
  })

  it('throws an error for poorly formed new Layer calls', () => {
    expect(() => new Layer()).toThrow() // No arguments
    expect(() => new Layer("projectID")).toThrow() // Missing required arguments
    expect(() => new Layer("projectID", null)).toThrow() // Null layer object
    expect(() => new Layer("projectID", { id: null, label: "Layer Label", pages: [] })).toThrow() // Invalid layer ID
    expect(() => new Layer("projectID", { id: "layerID", label: null, pages: [] })).toThrow() // Invalid layer label
    expect(() => new Layer("projectID", { id: "layerID", label: "Layer Label", pages: null })).toThrow() // Invalid pages array
  })
})
