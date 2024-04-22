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
        const result = await database.save(test_manifest)
        test_manifest["@id"] = result["@id"]
        expect(result["@id"]).toBeTruthy()
    })

    it('updates an existing object', async () => {
        test_manifest.name = "Test Project -- Updated"
        const result = await database.update(test_manifest)
        expect(result["@id"]).toBeTruthy()
    })

    it('Finds matching objects by query', async () => {
        const result = await database.find({ "@id": test_manifest["@id"] })
        expect(result[0]["@id"]).toBe(test_manifest["@id"])
    })

    //TODO
    it('Deletes an object with the provided id', async () => {
        expect(true).toBeTruthy()
    })

    it('Validates a possible id string', async () => {
        expect(database.isValidId(123)).toBeTruthy()
        expect(database.isValidId(-123)).toBeTruthy()
        expect(database.isValidId("123")).toBeTruthy()
        expect(database.isValidId({})).toBeFalsy()
        expect(database.isValidId('123abc123abc123abc123abc')).toBeTruthy()
        expect(database.isValidId('123abc123abc123abc123abcTooLong')).toBeFalsy()

        expect(database.asValidId(123)).toBe(123)
        expect(database.asValidId('123abc123abc123abc123abc')).toBe('123abc123abc123abc123abc')
        expect(database.asValidId({})).toBe('000000000000000000becbec')
        expect(database.asValidId(-123)).toBe(-123)
    })
})
