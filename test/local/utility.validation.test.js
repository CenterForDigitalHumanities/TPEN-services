import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateProjectPayload } from '../../utilities/validatePayload.js'
import scrubDefaultRoles from '../../utilities/isDefaultRole.js'

function buildValidProjectPayload() {
  return {
    metadata: [{ label: { none: ['source'] }, value: 'test source' }],
    layers: [
      {
        id: 'layer-1',
        label: 'Layer 1',
        pages: [{ id: 'page-1', target: 'https://example.org/canvas/1' }]
      }
    ],
    label: 'Project Label',
    manifest: ['https://example.org/manifest.json'],
    creator: 'user-1',
    group: 'group-1',
    tools: [
      {
        label: 'Sample tool',
        toolName: 'sample-tool',
        location: 'pane',
        custom: { enabled: true, tagName: 'sample-tool' }
      }
    ]
  }
}

describe('Validation utilities', () => {
  it('accepts a minimally valid project payload', () => {
    const result = validateProjectPayload(buildValidProjectPayload())

    assert.equal(result.isValid, true)
    assert.equal(result.errors, null)
  })

  it('rejects payloads missing required fields', () => {
    const result = validateProjectPayload({ label: 'only-label' })

    assert.equal(result.isValid, false)
    assert.match(result.errors ?? '', /Missing required elements/)
  })

  it('rejects invalid tool name format', () => {
    const payload = buildValidProjectPayload()
    payload.tools[0].toolName = 'BadToolName'

    const result = validateProjectPayload(payload)

    assert.equal(result.isValid, false)
    assert.match(result.errors ?? '', /lowercase-with-hyphens/)
  })

  it('scrubs default internal roles', () => {
    const filteredArray = scrubDefaultRoles(['OWNER', 'CUSTOM_ROLE'])
    assert.deepEqual(filteredArray, ['CUSTOM_ROLE'])

    const filteredObject = scrubDefaultRoles({ OWNER: ['*'], CUSTOM_ROLE: ['READ_*_*'] })
    assert.deepEqual(filteredObject, { CUSTOM_ROLE: ['READ_*_*'] })
  })
})
