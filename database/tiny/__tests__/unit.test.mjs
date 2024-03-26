/**
    * This should test unit actions against the TinyPEN Controller.
    * 
    * @author Bryan Haberberger
    * https://github.com/thehabes 
*/

import DatabaseController from '../controller.mjs'
const database = new DatabaseController()

let test_manifest = { "type": "Manifest", "name": "Test Manifest" }

beforeAll(async () => {
    return await database.connect()
})

afterAll(async () => {
    return await database.close()
})

describe('TinyPen Unit Functions. #tiny_unit #db', () => {
    it('connects for an active connection', async () => {
        const result = await database.connected()
        expect(result).toBe(true)
    })
    it('creates a new object', async () => {
        const result = await database.create(test_manifest)
        test_manifest["@id"] = result["@id"]
        expect(result["@id"]).toBeTruthy()
    })

    it('updates an existing object', async () => {
        test_manifest.name = "Test Project -- Updated"
        const result = await database.update(test_manifest)
        expect(result["@id"]).toBeTruthy()
    })

    it('Finds matching objects by query', async () => {
        const result = await database.read({ "@id": test_manifest["@id"] })
        expect(result[0]["@id"]).toBe(test_manifest["@id"])
    })

    //TODO
    it('Deletes an object with the provided id', async () => {
        expect(true).toBeTruthy()
    })
})