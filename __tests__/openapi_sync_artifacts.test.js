import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, "..")

describe("Shared OpenAPI artifact sync scaffolding #exists_unit", () => {
  it("verifies provider artifact has expected OpenAPI baseline fields", () => {
    const providerArtifactPath = path.join(repoRoot, "openapi/components/tpen-services-shared-components.openapi.yaml")
    const providerArtifact = fs.readFileSync(providerArtifactPath, "utf8")

    expect(providerArtifact).toContain("openapi: 3.0.3")
    expect(providerArtifact).toContain("title: TPEN Services Shared OpenAPI Components")
    expect(providerArtifact).toContain("version: 0.1.0")
    expect(providerArtifact).toContain("components:")
    expect(providerArtifact).toContain("schemas: {}")
  })

  it("verifies the shared artifact sync workflow configuration", () => {
    const workflowPath = path.join(repoRoot, ".github/workflows/sync_tpen_shared_openapi.yaml")
    const workflow = fs.readFileSync(workflowPath, "utf8")

    expect(workflow).toContain("openapi/components/tpen-services-shared-components.openapi.yaml")
    expect(workflow).toContain("repository: cubap/rerum_openapi")
    expect(workflow).toContain("schemas/openapi/tpen-services-shared-components.openapi.yaml")
    expect(workflow).toContain("secrets.OPENAPI")
  })
})
