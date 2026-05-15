import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '../..')

describe('OpenAPI shared artifacts', () => {
  it('contains expected baseline fields in provider artifact', () => {
    const providerArtifactPath = path.join(repoRoot, 'openapi/components/tpen-services-shared-components.openapi.yaml')
    const providerArtifact = fs.readFileSync(providerArtifactPath, 'utf8')

    assert.match(providerArtifact, /openapi: 3\.0\.3/)
    assert.match(providerArtifact, /title: TPEN Services Shared OpenAPI Components/)
    assert.match(providerArtifact, /version: 0\.1\.0/)
    assert.match(providerArtifact, /components:/)
    assert.match(providerArtifact, /schemas: \{\}/)
  })

  it('keeps sync workflow wired to shared artifact path', () => {
    const workflowPath = path.join(repoRoot, '.github/workflows/sync_tpen_shared_openapi.yaml')
    const workflow = fs.readFileSync(workflowPath, 'utf8')

    assert.match(workflow, /openapi\/components\/tpen-services-shared-components\.openapi\.yaml/)
    assert.match(workflow, /repository: cubap\/rerum_openapi/)
    assert.match(workflow, /schemas\/openapi\/tpen-services-shared-components\.openapi\.yaml/)
    assert.match(workflow, /secrets\.OPENAPI/)
  })
})
