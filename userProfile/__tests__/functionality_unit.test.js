import { validateID } from '../../utilities/shared.js'
import { test, describe } from 'node:test'
import assert from 'node:assert'

describe('Testing /user/:id helper functions) #testThis', () => {
  test('returns false for invalid ID and for no ID', () => {
    assert.strictEqual(validateID(), false)
    assert.strictEqual(validateID('jkl'), false)
  })

  test('returns true for valid id', () => {
    assert.strictEqual(validateID(123), true)
  })
})
