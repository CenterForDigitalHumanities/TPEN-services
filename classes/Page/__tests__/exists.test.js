import Page from "../Page.js"

describe('Page Class looks how we expect it to. #Page_exists_unit', () => {
  it('Imports Page', () => {
    expect(typeof Page).toBe('function')
  })

  const page = new Page("layerID", { id: "canvasID", label: "Canvas Label", target: "https://example.com/canvas" })
  it('has expected methods', () => {
    expect(typeof page.update).toBe('function')
    expect(typeof page.delete).toBe('function')
    expect(typeof Page.build).toBe('function')
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
    expect(() => new Page("layerID", { id: "canvasID", label: "Canvas Label", target: null })).toThrow() // Invalid canvas target
  })
})

describe('Page Resolution Support #resolution', () => {
  it('should support pages with resolved items', () => {
    const pageWithResolvedItems = {
      id: "test-page-id",
      label: "Test Page",
      items: [
        { 
          id: "test-item-1", 
          body: [{ type: "TextualBody", value: "Resolved content" }], 
          creator: "https://example.org/user/1" 
        }
      ]
    }
    const page = new Page("test-layer", pageWithResolvedItems)
    expect(page).toHaveProperty('items')
    expect(Array.isArray(page.items)).toBe(true)
    expect(page.items.length).toBe(1)
  })

  it('should handle pages with both resolved and unresolved items', () => {
    const mixedPage = {
      id: "test-page-mixed",
      label: "Mixed Page",
      items: [
        { id: "unresolved-item" },
        { id: "resolved-item", body: [{ type: "TextualBody", value: "Content" }] }
      ]
    }
    const page = new Page("test-layer", mixedPage)
    expect(page.items.length).toBe(2)
    expect(page.items[0]).toHaveProperty('id')
    expect(page.items[1]).toHaveProperty('body')
  })
})
