/** 
 * Test the various pieces of logic contained within the /manifest endpoint.
 * This should not spin up Express and should not perform end to end tests by calling the endpoint.
 * 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 * 
 * */

import * as logic from '../manifest.mjs'

let test_manifest = { "type": "Manifest", "label": {"en":["Test Manifest"]} }
let updated_manifest = {}

describe('Manifest endpoint functionality unit test (just testing helper functions). #functions_unit', () => {
  it('Creates a Manifest', async () => {
    test_manifest = await logic.createManifest(test_manifest)
    expect(test_manifest["@id"]).toBeTruthy()
  })
  it('Finds the manifest by _id', async () => {
    const found = await logic.findTheManifestByID(test_manifest["@id"].split("/").pop())
    expect(found["@id"].split("/").pop()).toBe(test_manifest["@id"].split("/").pop())
  })
  it('Updates the Manifest', async () => {
    test_manifest.updated = true
    updated_manifest = await logic.updateManifest(test_manifest)
    expect(updated_manifest["@id"]).toBeTruthy()
    expect(updated_manifest["@id"]).not.toBe(test_manifest["@id"])
  })
  it('Reads for the Manifest', async () => {
    const found = await logic.queryForManifests({"@id":updated_manifest["@id"]})
    expect(found.length).toBe(1)
  })
  it('Deletes the Manifest Stub', async () => {
    expect(true).toBe(true)
  })
}) 
