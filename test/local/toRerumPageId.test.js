import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { toRerumPageId } from '../../utilities/rerumId.js'

// The pre-refactor formula, kept to prove stored ids do not change.
const legacy = (id) => id.startsWith(process.env.RERUMIDPREFIX)
  ? id
  : `${process.env.RERUMIDPREFIX}${id.split("/").pop()}`

describe('toRerumPageId', () => {
  const prefix = process.env.RERUMIDPREFIX
  it('has RERUMIDPREFIX configured', () => assert.ok(prefix))
  it('maps a bare RERUM-style URI to prefix + last segment', () => {
    const id = 'https://store.rerum.io/v1/id/abc123'
    assert.equal(toRerumPageId(id), `${prefix}abc123`)
    assert.equal(toRerumPageId(id), legacy(id))
  })
  it('maps a UUID-only id', () => {
    const id = '0b1e7a52-3c1d-4f6e-9a77-1d2f3a4b5c6d'
    assert.equal(toRerumPageId(id), `${prefix}${id}`)
    assert.equal(toRerumPageId(id), legacy(id))
  })
  it('returns ids already carrying RERUMIDPREFIX unchanged', () => {
    const id = `${prefix}abc123`
    assert.equal(toRerumPageId(id), id)
    assert.equal(toRerumPageId(id), legacy(id))
  })
})
