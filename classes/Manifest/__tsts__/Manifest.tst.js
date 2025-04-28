import Manifest from '../Manifest.js'
import sinon from 'sinon'
import { Vault } from '@iiif/helpers/vault'
import assert from 'assert'
import { test, beforeEach, afterEach, describe } from 'node:test'

class MockVault extends Vault {
    constructor() {
        super()
        this.loadManifest = async () => 'loaded manifest'
    }
}

describe('Manifest', () => {
    let vaultMock

    beforeEach(() => {
        sinon.restore()
    })
})

test('should throw error for invalid input type', () => {
    assert.throws(() => new Manifest(123), /Invalid input: must be a valid URI string/)
})
test('should throw error for invalid input type', () => {
    assert.throws(() => new Manifest({}), /Invalid input: must be a valid URI string/)
})
test('should throw error for invalid input type', () => {
    assert.throws(() => new Manifest(true), /Invalid input: must be a valid URI string/)
})

test('should throw error for manifest object without id', () => {
    assert.throws(() => new Manifest(), /Invalid input: Manifest object must have an @id or id property/)
})

test('should throw error for invalid URI string', () => {
    assert.throws(() => new Manifest('invalid-uri'), /Invalid input: must be a valid URI string/)
})

test('should warn for manifest object missing required properties', () => {
    const manifest = { id: 'http://example.com/manifest' }
    const originalWarn = console.warn
    console.warn = () => { }
    const warnSpy = sinon.spy(console, 'warn')
    const manifestInstance = new Manifest(manifest)
    assert(warnSpy.called)
    assert.strictEqual(manifestInstance.uri, 'http://example.com/manifest')
    assert.strictEqual(manifestInstance.manifest, null)
    console.warn = originalWarn
})
sinon.stub(Manifest.prototype, 'load').resolves('loaded manifest')
const manifest = new Manifest('http://example.com/manifest')
test('should initialize with valid URI string', () => {
    const manifest = new Manifest('http://example.com/manifest')
    assert.strictEqual(manifest.uri, 'http://example.com/manifest')
    assert.strictEqual(manifest.manifest, null)
})

test('should initialize with valid manifest object', () => {
    const manifestObj = {
        id: 'http://example.com/manifest',
        '@type': 'sc:Manifest',
        '@context': 'http://iiif.io/api/presentation/2/context.json',
        sequences: []
    }
    const manifest = new Manifest(manifestObj)
    assert.strictEqual(manifest.uri, 'http://example.com/manifest')
    assert.deepStrictEqual(manifest.manifest, manifestObj)
})

test('should load manifest using vault', async () => {
    const manifest = new Manifest('http://example.com/manifest')
    const result = await manifest.load()
    assert.strictEqual(result, 'loaded manifest')
})
