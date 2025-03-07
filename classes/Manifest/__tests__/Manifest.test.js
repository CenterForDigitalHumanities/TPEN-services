import Manifest from '../Manifest'
import { Vault } from '@iiif/helpers/vault'

jest.mock('@iiif/helpers/vault')

describe('Manifest', () => {
    let vaultMock

    beforeEach(() => {
        vaultMock = new Vault()
        Vault.mockImplementation(() => vaultMock)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('should throw error for invalid input type', () => {
        expect(() => new Manifest(123)).toThrow('Invalid input: must be a manifest object or a URI string')
    })

    test('should throw error for manifest object without id', () => {
        expect(() => new Manifest({})).toThrow('Invalid input: manifest object must have an @id or id property')
    })

    test('should throw error for invalid URI string', () => {
        expect(() => new Manifest('invalid-uri')).toThrow('Invalid input: must be a valid URI string')
    })

    test('should warn for manifest object missing required properties', () => {
        const manifest = { id: 'http://example.com/manifest' }
        console.warn = jest.fn()
        const manifestInstance = new Manifest(manifest)
        expect(console.warn).toHaveBeenCalled()
        expect(manifestInstance.uri).toBe('http://example.com/manifest')
        expect(manifestInstance.manifest).toBeNull()
    })

    test('should initialize with valid URI string', () => {
        const manifest = new Manifest('http://example.com/manifest')
        expect(manifest.uri).toBe('http://example.com/manifest')
        expect(manifest.manifest).toBeNull()
    })

    test('should initialize with valid manifest object', () => {
        const manifestObj = {
            id: 'http://example.com/manifest',
            '@type': 'sc:Manifest',
            '@context': 'http://iiif.io/api/presentation/2/context.json',
            sequences: []
        }
        const manifest = new Manifest(manifestObj)
        expect(manifest.uri).toBe('http://example.com/manifest')
        expect(manifest.manifest).toEqual(manifestObj)
    })

    test('should load manifest using vault', async () => {
        const manifest = new Manifest('http://example.com/manifest')
        vaultMock.loadManifest.mockResolvedValue('loaded manifest')
        const result = await manifest.load()
        expect(vaultMock.loadManifest).toHaveBeenCalledWith('http://example.com/manifest')
        expect(result).toBe('loaded manifest')
    })
})
