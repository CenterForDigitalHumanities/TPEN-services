import Project from "../Project.mjs"
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

 

describe("Project Class ", () => {
  it("should have a constructor", () => {
    expect(Project.prototype.constructor).toBeInstanceOf(Function);
  });

  it("should have a create method", () => {
    expect(typeof Project.prototype.create).toBe("function");
  });

  it("should have an sendInvite method", () => {
    expect(typeof Project.prototype.sendInvite).toBe("function");
  });

  it("should have a removeMember method", () => {
    expect(typeof Project.prototype.removeMember).toBe("function");
  });

  it("should have a checkUserAccess method", () => {
    expect(typeof Project.prototype.checkUserAccess).toBe("function");
  });

  it("should have a inviteExistingTPENUser method", () => {
    expect(typeof Project.prototype.inviteExistingTPENUser).toBe("function");
  });

  it("should have a inviteNewTPENUser method", () => {
    expect(typeof Project.prototype.inviteNewTPENUser).toBe("function");
  });

});
