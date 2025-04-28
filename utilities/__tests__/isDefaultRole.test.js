import scrubDefaultRoles from '../isDefaultRole.mjs'
import Group from '../../classes/Group/Group.mjs'

describe('scrubDefaultRoles function #customRole_unit', () => {
    beforeAll(() => {
        Group.defaultRoles = {
            admin: 'admin',
            user: 'user',
            guest: 'guest'
        }
    })

    it('should remove default roles from an array of role strings', () => {
        const roles = ['admin', 'customRole']
        const result = scrubDefaultRoles(roles)
        expect(result).toEqual(['customRole'])
    })

    it('should return false if all roles in the array are default roles', () => {
        const roles = ['admin', 'user']
        const result = scrubDefaultRoles(roles)
        expect(result).toBe(false)
    })

    it('should throw an error if the array contains non-string elements', () => {
        const roles = ['admin', 123]
        expect(() => scrubDefaultRoles(roles)).toThrow('Expecting a RolesMap and not an Array.')
    })

    it('should remove default roles from an object of roles', () => {
        const roles = { admin: 'admin', customRole: 'customRole' }
        const result = scrubDefaultRoles(roles)
        expect(result).toEqual({ customRole: 'customRole' })
    })

    it('should return false if all roles in the object are default roles', () => {
        const roles = { admin: 'admin', user: 'user' }
        const result = scrubDefaultRoles(roles)
        expect(result).toBe(false)
    })
})
