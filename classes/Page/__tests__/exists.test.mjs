import Page from "../Page.mjs"

describe('Page Class looks how we expect it to. #Page_exists_unit', () => {
  it('Imports Page', () => {
    expect(Page.constructor).toBeInstanceOf(Function)
  })

  const page = new Page()
  it('has useful methods', () => {
    expect(page.saveCollectionToRerum).toBeInstanceOf(Function)
    expect(page.update).toBeInstanceOf(Function)
    expect(page.save).toBeInstanceOf(Function)
  })

})
