import ImportProject from "../ImportProject.mjs"

describe("ImportProject Class #importTests", () => {
  it("should have a constructor", () => {
    expect(ImportProject.prototype.constructor).toBeInstanceOf(Function)
  })

  it("should have a static fetchManifest method", () => {
    expect(typeof ImportProject.fetchManifest).toBe("function")
  })

  it("should have a static processManifest method", () => {
    expect(typeof ImportProject.processManifest).toBe("function")
  })

  it("should have a static processLayerFromCanvas method", () => {
    expect(typeof ImportProject.processLayerFromCanvas).toBe("function")
  })

  it("should have a static fromManifest method", () => {
    expect(typeof ImportProject.fromManifestURL).toBe("function")
  })
})
