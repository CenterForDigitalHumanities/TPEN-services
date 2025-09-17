import scrubDefaultRoles from '../isDefaultRole.js'

describe('scrubDefaultRoles function #customRole_unit', () => {
    it('should remove default roles from an array of role strings', () => {
        const roles = ['OWNER', 'customRole']
        const result = scrubDefaultRoles(roles)
        expect(result).toEqual(['customRole'])
    })

    it('should return false if all roles in the array are default roles', () => {
        const roles = ['OWNER', 'VIEWER']
        const result = scrubDefaultRoles(roles)
        expect(result).toBe(false)
    })

    it('should throw an error if the array contains non-string elements', () => {
        const roles = ['OWNER', 123]
        expect(() => scrubDefaultRoles(roles)).toThrow('Expecting a RolesMap and not an Array.')
    })

    it('should remove default roles from an object of roles', () => {
        const roles = { OWNER: 'OWNER', customRole: 'customRole' }
        const result = scrubDefaultRoles(roles)
        expect(result).toEqual({ customRole: 'customRole' })
    })

    it('should return false if all roles in the object are default roles', () => {
        const roles = { OWNER: 'OWNER', VIEWER: 'VIEWER' }
        const result = scrubDefaultRoles(roles)
        expect(result).toBe(false)
    })
})
