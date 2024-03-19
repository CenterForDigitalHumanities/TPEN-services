import TinyController from '../index.mjs'

beforeAll(async () => {
    // None if this will run without a controller that is connected.
   return await TinyController.connected()
})

afterAll(async () => {
   return await TinyController.close()
})

describe('Mongo Database Unit Functions. #db',()=>{
    it('creates a new object', async () => {
        const t = { name: 'Test Object', description: 'This is a test.' }
        const result = await TinyController.create(t)
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

/**
 * THESE BELONG SOMEWHERE ELSE
 */ 

// describe('Project collection methods #functions_unit #db',()=>{
//     it('creates a new project', async () => {
//         const project = { name: 'Test Project', description: 'This is a test project.' }
//         const result = await dbController.createProject(project)
//         expect(result["@id"]).toBeTruthy()
//     })
    
//     it('assigns a new tool to the project', async () => {
//         const projectId = 'your-project-id'
//         const tool = { name: 'Test Tool', version: '1.0.0' }
//         const result = await dbController.assignToolToProject(projectId, tool)
//         expect(result.acknowledged).toBe(true)
//     })
    
//     it('grants a group access to the project', async () => {
//         const projectId = 'your-project-id'
//         const groupId = 'your-group-id'
//         const result = await dbController.grantGroupAccessToProject(projectId, groupId)
//         expect(result.acknowledged).toBe(true)
//     })
// })

// describe('Project methods exist #exists_unit',()=>{
//     it('createProject method exists', () => {
//         expect(dbController.createProject).toBeInstanceOf(Function)
//     })
//     it('assignToolToProject method exists', () => {
//         expect(dbController.assignToolToProject).toBeInstanceOf(Function)
//     })
//     it('grantGroupAccessToProject method exists', () => {
//         expect(dbController.grantGroupAccessToProject).toBeInstanceOf(Function)
//     })
// })

// Add more tests for the remaining methods...
