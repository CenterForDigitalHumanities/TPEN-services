import { Page } from "../Page.mjs"

describe('Page Class looks how we expect it to. #Page_exists_unit', () => {
  it('Imports Page', () => {
    expect(Page.constructor).toBeInstanceOf(Function)
  })

  const page = new Page()

  it('has useful methods', () => {
    expect(page.asCanvas).toBeInstanceOf(Function)
    expect(page.create).toBeInstanceOf(Function)
    expect(page.remove).toBeInstanceOf(Function)
    expect(page.save).toBeInstanceOf(Function)
    expect(page.fetch).toBeInstanceOf(Function)
  })

  it('configures a correct Annotation', () => {
    expect(page.id).toBeDefined()
    const canvas = page.asCanvas()
    expect(canvas).toBeInstanceOf(Object)
    expect(canvas.type).toBe('Annotation')
    expect(canvas['@context'].toBe("http://iiif.io/api/presentation/3/context.json"))
    expect(canvas.height).toBeDefined()
    expect(canvas.width).toBeDefined()
  })
})
