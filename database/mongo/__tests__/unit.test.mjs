/**
    * This should test unit actions against the MongoDB Controller.
    * 
    * @author Bryan Haberberger
    * https://github.com/thehabes 
*/

import DatabaseController from '../controller.mjs'
const database = new DatabaseController()

let test_proj = { "@type": "Project", "name": "Test Project" }
let test_group = { "@type": "Group", "name": "Test Group" }
let test_userPreferences = { "@type": "UserPreferences", "name": 'Test UserReferences' }

beforeAll(async () => {
    return await database.connect()
})

afterAll(async () => {
    return await database.close()
})

describe('Mongo Database Unit Functions. #mongo_unit #db', () => {
    it('connects for an active connection', async () => {
        const result = await database.connected()
        expect(result).toBe(true)
    })
    it('creates a new project', async () => {
        const result = await database.create(test_proj)
        test_proj["_id"] = result["_id"]
        expect(result["_id"]).toBeTruthy()
    })
    it('creates a new group', async () => {
        const result = await database.create(test_group)
        test_group["_id"] = result["_id"]
        expect(result["_id"]).toBeTruthy()
    })
    it('creates a new userPreferences', async () => {
        const result = await database.create(test_userPreferences)
        test_userPreferences["_id"] = result["_id"]
        expect(result["_id"]).toBeTruthy()
    })

    it('updates an existing project', async () => {
        test_proj.name = "Test Project -- Updated"
        const result = await database.update(test_proj)
        expect(result["_id"]).toBeTruthy()
    })
    it('updates an existing group', async () => {
        test_group.name = "Test Group -- Updated"
        const result = await database.update(test_group)
        expect(result["_id"]).toBeTruthy()
    })
    it('updates an existing userPreferences', async () => {
        test_userPreferences.name = "Test UserPreferences -- Updated"
        const result = await database.update(test_userPreferences)
        expect(result["_id"]).toBeTruthy()
    })

    it('Finds matching projects by query', async () => {
        const result = await database.read(test_proj)
        expect(result[0]["_id"]).toBe(test_proj["_id"])
    })
    it('Finds matching groups by query', async () => {
        const result = await database.read(test_group)
        expect(result[0]["_id"]).toBe(test_group["_id"])
    })
    it('Finds matching userPreferences by query', async () => {
        const result = await database.read(test_userPreferences)
        expect(result[0]["_id"]).toBe(test_userPreferences["_id"])
    })

    //TODO
    it('Deletes an object with the provided id', async () => {
        expect(true).toBeTruthy()
    })
})