import ProjectFactory from "../ProjectFactory.mjs"

describe("ProjectFactory Class #importTests", () => {
  it("should have a constructor", () => {
    expect(ProjectFactory.prototype.constructor).toBeInstanceOf(Function)
  })

  it("should have a static fetchManifest method", () => {
    expect(typeof ProjectFactory.fetchManifest).toBe("function")
  })

  it("should have a static processManifest method", () => {
    expect(typeof ProjectFactory.processManifest).toBe("function")
  })

  it("should have a static processLayerFromCanvas method", () => {
    expect(typeof ProjectFactory.processLayerFromCanvas).toBe("function")
  })

  it("should have a static fromManifest method", () => {
    expect(typeof ProjectFactory.fromManifestURL).toBe("function")
  })
})
