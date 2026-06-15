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

    assert.equal(result.isValid, true, 'a fully-formed payload must validate as true')
    assert.equal(result.errors, null, 'a valid payload must report no errors')
  })

  it('rejects payloads missing required fields', () => {
    const result = validateProjectPayload({ label: 'only-label' })

    assert.equal(result.isValid, false, 'payload missing required fields must not validate')
    assert.match(result.errors ?? '', /Missing required elements/, 'error must call out missing required elements')
  })

  it('rejects invalid tool name format', () => {
    const payload = buildValidProjectPayload()
    payload.tools[0].toolName = 'BadToolName'

    const result = validateProjectPayload(payload)

    assert.equal(result.isValid, false, 'non-kebab-case toolName must not validate')
    assert.match(result.errors ?? '', /lowercase-with-hyphens/, 'error must call out the lowercase-with-hyphens format rule')
  })

  it('scrubs default internal roles', () => {
    const filteredArray = scrubDefaultRoles(['OWNER', 'CUSTOM_ROLE'])
    assert.deepEqual(filteredArray, ['CUSTOM_ROLE'], 'OWNER must be stripped from a role-name array')

    const filteredObject = scrubDefaultRoles({ OWNER: ['*'], CUSTOM_ROLE: ['READ_*_*'] })
    assert.deepEqual(filteredObject, { CUSTOM_ROLE: ['READ_*_*'] }, 'OWNER key must be stripped from a roles map')
  })

  it('accepts metadata with non-"none" language tags', () => {
    const payload = buildValidProjectPayload()
    payload.metadata = [
      { label: { en: ['Author'] }, value: { en: ['John Doe'] } },
      { label: { fr: ['Auteur'] }, value: { fr: ['Jean Dupont'] } },
      { label: { la: ['Auctor'] }, value: { la: ['Iohannes'] } }
    ]

    const result = validateProjectPayload(payload)

    assert.equal(result.isValid, true)
    assert.equal(result.errors, null)
  })

  it('accepts metadata with mixed language tags and plain strings', () => {
    const payload = buildValidProjectPayload()
    payload.metadata = [
      { label: 'Source', value: 'Test Source' },
      { label: { en: ['Title'] }, value: 'Plain String Value' },
      { label: 'Date', value: { en: ['2024-01-01'] } }
    ]

    const result = validateProjectPayload(payload)

    assert.equal(result.isValid, true)
    assert.equal(result.errors, null)
  })

  it('rejects metadata with empty language map', () => {
    const payload = buildValidProjectPayload()
    payload.metadata = [
      { label: {}, value: 'test value' }
    ]

    const result = validateProjectPayload(payload)

    assert.equal(result.isValid, false)
    assert.match(result.errors ?? '', /language map/)
  })

  it('rejects metadata with language map containing non-string values', () => {
    const payload = buildValidProjectPayload()
    payload.metadata = [
      { label: { en: ['Author'] }, value: { en: [123] } }
    ]

    const result = validateProjectPayload(payload)

    assert.equal(result.isValid, false)
    assert.match(result.errors ?? '', /language map/)
  })

  it('rejects metadata with language map containing empty array', () => {
    const payload = buildValidProjectPayload()
    payload.metadata = [
      { label: { en: ['Author'] }, value: { en: [] } }
    ]

    const result = validateProjectPayload(payload)

    assert.equal(result.isValid, false)
    assert.match(result.errors ?? '', /language map/)
  })
})
