import MongoController from '../index.mjs'

beforeAll(async () => {
    // None if this will run without a controller that is connected.
   return await MongoController.connected()
})

afterAll(async () => {
   return await MongoController.close()
})

describe('Mongo Database Unit Functions. #db',()=>{
    it('creates a new object', async () => {
        const t = { name: 'Test Object', description: 'This is a test.' }
        const result = await MongoController.create(process.env.TPENPROJECTS, t)
        expect(result["_id"]).toBeTruthy()
    })
    it('updates an existing object', async () => {
        expect(true).toBeTruthy()
    })
    it('Finds a single object by the provided id', async () => {
        expect(true).toBeTruthy()
    })
    it('Finds multiple objects by matching on provided properties', async () => {
        expect(true).toBeTruthy()
    })
    it('Deletes an object with the provided id', async () => {
        expect(true).toBeTruthy()
    })
})
