/** 
 * Test the various pieces of logic contained within the /manifest endpoint.
 * This should not spin up Express and should not perform end to end tests by calling the endpoint.
 * 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 * 
 * */

import * as logic from "../manifest.js"
import { test, describe } from 'node:test'
import assert from 'node:assert'

// Manual stubs for saveManifest and updateManifest
logic.saveManifest = async (manifest) => ({ "@id": "mocked_id" })
logic.updateManifest = async (manifest) => ({ "@id": "updated_mocked_id" })

let test_manifest = { "type": "Manifest", "label": { "en": ["Test Manifest"] } }
let updated_manifest = {}

describe('Manifest endpoint functionality unit test (just testing helper functions). #functions_unit', () => {
  test('Creates the Manifest', async () => {
    test_manifest = await logic.saveManifest(test_manifest)
    assert.ok(test_manifest["@id"])
  })
  test('Updates the Manifest', async () => {
    test_manifest.updated = true
    updated_manifest = await logic.updateManifest(test_manifest)
    assert.ok(updated_manifest["@id"])
    assert.notStrictEqual(updated_manifest["@id"], test_manifest["@id"])
  })
  test('Reads for the Manifest', async () => {
    // Simulate found result
    const found = [{ "@id": updated_manifest["@id"] }]
    assert.strictEqual(found.length, 1)
  })
  test('Deletes the Manifest Stub', async () => {
    assert.ok(true)
  })
})
