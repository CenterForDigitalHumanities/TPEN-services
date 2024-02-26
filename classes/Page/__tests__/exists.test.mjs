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
    expect(page.addMembershipToManifest).toBeInstanceOf(Function)
    expect(page.getPreviousPage).toBeInstanceOf(Function)
    expect(page.getNextPage).toBeInstanceOf(Function)
    expect(page.handleTextBlob).toBeInstanceOf(Function)
    expect(page.handleImageAnnotation).toBeInstanceOf(Function)
    expect(page.getParentPage).toBeInstanceOf(Function)
    expect(page.getSiblingPages).toBeInstanceOf(Function)
    expect(page.getChildrenPages).toBeInstanceOf(Function)
    expect(page.getProject).toBeInstanceOf(Function)
    expect(page.getPageInfo).toBeInstanceOf(Function)
    expect(page.embedDocuments).toBeInstanceOf(Function)
    expect(page.getMetadata).toBeInstanceOf(Function)
    expect(page.getHTMLDocument).toBeInstanceOf(Function)
  })

  it('configures a correct Canvas', () => {
    expect(page.id).toBeDefined()
    const canvas = page.asCanvas()
    expect(canvas).toBeInstanceOf(Object)
    expect(canvas.type).toBe('Canvas')
    expect(canvas['@context']).toBe("http://iiif.io/api/presentation/3/context.json")
    expect(canvas.height).toBeDefined()
    expect(canvas.width).toBeDefined()
  })

})
