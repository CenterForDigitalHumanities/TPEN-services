import Layer from "../Layer.mjs"

describe('Layer Class looks how we expect it to. #Layer_exists_unit', () => {
  it('Imports Layer', () => {
    expect(Layer.constructor).toBeInstanceOf(Function)
  })

  const layer = new Layer()

  it('has useful methods', () => {
    expect(layer.addLayer).toBeInstanceOf(Function)
    expect(layer.deleteLayer).toBeInstanceOf(Function)
    expect(layer.update).toBeInstanceOf(Function)
  })
})
