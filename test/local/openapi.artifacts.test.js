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

    // Pin the cp invocation as a single regex so source→target direction is enforced.
    // Each path appears 3× in this workflow (trigger filter, cp command, PR body), so
    // a global substring match for either side cannot detect a swap or a deleted cp step.
    assert.match(
      workflow,
      /run:\s*cp\s+openapi\/components\/tpen-services-shared-components\.openapi\.yaml\s+receiver\/schemas\/openapi\/tpen-services-shared-components\.openapi\.yaml/,
      'sync workflow must cp the canonical source artifact to the receiver target path (this exact direction)'
    )
    assert.match(workflow, /repository: cubap\/rerum_openapi/, 'workflow must check out cubap/rerum_openapi as the receiver')
    assert.match(
      workflow,
      /peter-evans\/create-pull-request@v\d+/,
      'workflow must pin a major version of peter-evans/create-pull-request — an unpinned action drifts silently across runs'
    )
    assert.match(
      workflow,
      /secrets\.OPENAPI(?!\w)/,
      'workflow must read the org-level OPENAPI secret — a rename to OPENAPI_FOO breaks the sync silently at receiver checkout'
    )
  })
})
