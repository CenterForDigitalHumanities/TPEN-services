import scrubDefaultRoles from '../isDefaultRole.js'
import Group from '../../classes/Group/Group.js'
import { test, describe, before, after, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'

describe('scrubDefaultRoles function #customRole_unit', () => {
  before(() => {
    Group.defaultRoles = {
      admin: 'admin',
      user: 'user',
      guest: 'guest'
    }
  })

  test('should remove default roles from an array of role strings', () => {
    const roles = ['admin', 'customRole']
    const result = scrubDefaultRoles(roles)
    assert.deepStrictEqual(result, ['customRole'])
  })

  test('should return false if all roles in the array are default roles', () => {
    const roles = ['admin', 'user']
    const result = scrubDefaultRoles(roles)
    assert.strictEqual(result, false)
  })

  test('should throw an error if the array contains non-string elements', () => {
    const roles = ['admin', 123]
    assert.throws(() => scrubDefaultRoles(roles), /Expecting a RolesMap and not an Array./)
  })

  test('should remove default roles from an object of roles', () => {
    const roles = { admin: 'admin', customRole: 'customRole' }
    const result = scrubDefaultRoles(roles)
    assert.deepStrictEqual(result, { customRole: 'customRole' })
  })

  test('should return false if all roles in the object are default roles', () => {
    const roles = { admin: 'admin', user: 'user' }
    const result = scrubDefaultRoles(roles)
    assert.strictEqual(result, false)
  })
})
