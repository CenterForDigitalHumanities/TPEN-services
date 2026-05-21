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

    assert.match(providerArtifact, /^openapi: 3\.\d+\.\d+/m, 'must declare an openapi 3.x version')
    assert.match(providerArtifact, /^\s+title: TPEN Services Shared OpenAPI Components/m, 'info.title must be present')
    assert.match(providerArtifact, /^\s+version: \d+\.\d+\.\d+(-[\w.]+)?/m, 'info.version must be a semver-style string')
    assert.match(providerArtifact, /^components:/m, 'must define a top-level components section')
  })

  it('keeps sync workflow wired to shared artifact path', () => {
    const workflowPath = path.join(repoRoot, '.github/workflows/sync_tpen_shared_openapi.yaml')
    const workflow = fs.readFileSync(workflowPath, 'utf8')

    assert.match(workflow, /openapi\/components\/tpen-services-shared-components\.openapi\.yaml/, 'workflow must reference the canonical shared-components source path')
    assert.match(workflow, /repository: cubap\/rerum_openapi/, 'workflow must check out cubap/rerum_openapi as the receiver')
    assert.match(workflow, /schemas\/openapi\/tpen-services-shared-components\.openapi\.yaml/, 'workflow must reference the receiver shared-components target path')
    assert.match(workflow, /secrets\.OPENAPI/, 'workflow must read the org-level OPENAPI secret — a rename here breaks the sync silently at receiver checkout')
  })
})
