import Page from "../Page.mjs"

describe('Page Class looks how we expect it to. #Page_exists_unit', () => {
  it('Imports Page', () => {
    expect(typeof Page).toBe('function')
  })

  const page = new Page("layerID", { id: "canvasID", label: "Canvas Label" }, "prevID", "nextID", [])
  it('has expected methods', () => {
    expect(typeof page.saveCollectionToRerum).toBe('function')
    expect(typeof page.update).toBe('function')
    expect(typeof page.save).toBe('function')
    expect(typeof page.delete).toBe('function') // Add this if `delete` is a new method
  })

  it('has expected properties', () => {
    expect(page).toHaveProperty('id') // Add this if `id` is a new property
    expect(page).toHaveProperty('title') // Add this if `title` is a new property
  })

  it('throws an error for poorly formed new Page calls', () => {
    expect(() => new Page()).toThrow() // No arguments
    expect(() => new Page("layerID")).toThrow() // Missing required arguments
    expect(() => new Page("layerID", null, "prevID", "nextID", [])).toThrow() // Null canvas object
    expect(() => new Page("layerID", { id: null, label: "Canvas Label" }, "prevID", "nextID", [])).toThrow() // Invalid canvas ID
    expect(() => new Page("layerID", { id: "canvasID"}, "prevID", "nextID", [])).toThrow() // Invalid canvas label
  })
})
