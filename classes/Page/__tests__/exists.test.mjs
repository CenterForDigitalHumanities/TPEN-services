import Page from "../Page.mjs"

describe('Page Class looks how we expect it to. #Page_exists_unit', () => {
  it('Imports Page', () => {
    expect(typeof Page).toBe('function')
  })

  const page = new Page("layerID", { id: "canvasID", label: "Canvas Label", target: "https://example.com/canvas" })
  
  it('has expected methods', () => {
    expect(typeof page.update).toBe('function')
    expect(typeof page.delete).toBe('function')
  })

  it('has expected properties', () => {
    expect(page).toHaveProperty('id')
    expect(page).toHaveProperty('label')
    expect(page).toHaveProperty('target')
  })

  it('throws an error for poorly formed new Page calls', () => {
    expect(() => new Page()).toThrow() // No arguments
    expect(() => new Page("layerID")).toThrow() // Missing required arguments
    expect(() => new Page("layerID", null)).toThrow() // Null canvas object
    expect(() => new Page("layerID", { id: null, label: "Canvas Label", target: "https://example.com/canvas" })).toThrow() // Invalid canvas ID
    expect(() => new Page("layerID", { id: "canvasID", label: null, target: "https://example.com/canvas" })).toThrow() // Invalid canvas label
    expect(() => new Page("layerID", { id: "canvasID", label: "Canvas Label", target: null })).toThrow() // Invalid canvas target
  })
})
