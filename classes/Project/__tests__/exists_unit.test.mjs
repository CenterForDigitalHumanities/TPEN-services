import ProjectFactory from "../ProjectFactory.mjs"

describe("ProjectFactory Class #importTests", () => {
  it("should have a constructor", () => {
    expect(ProjectFactory.prototype.constructor).toBeInstanceOf(Function)
  })

  it("should have a static loadManifest method", () => {
    expect(typeof ProjectFactory.loadManifest).toBe("function")
  })

  it("should have a static DBObjectFromManifest method", () => {
    expect(typeof ProjectFactory.DBObjectFromManifest).toBe("function")
  })

  it("should have a static processLayerFromCanvas method", () => {
    expect(typeof ProjectFactory.processLayerFromCanvas).toBe("function")
  })

  it("should have a static fromManifest method", () => {
    expect(typeof ProjectFactory.fromManifestURL).toBe("function")
  })
})
