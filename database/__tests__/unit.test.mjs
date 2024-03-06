import { it } from 'node:test'
import DatabaseController from '../index.mjs'

const dbController = new DatabaseController('mongodb://localhost:12707/testTpen')

beforeAll(async () => {
    await dbController.connect()
})

afterAll(async () => {
    await dbController.close()
})

describe.skip('Project collection methods #_unit #db',()=>{
    it('creates a new project', async () => {
        const project = { name: 'Test Project', description: 'This is a test project.' }
        const result = await dbController.createProject(project)
        expect(result.insertedCount).toBe(1)
    })
    
    it('assigns a new tool to the project', async () => {
        const projectId = 'your-project-id'
        const tool = { name: 'Test Tool', version: '1.0.0' }
        const result = await dbController.assignToolToProject(projectId, tool)
        expect(result.modifiedCount).toBe(1)
    })
    
    it('grants a group access to the project', async () => {
        const projectId = 'your-project-id'
        const groupId = 'your-group-id'
        const result = await dbController.grantGroupAccessToProject(projectId, groupId)
        expect(result.modifiedCount).toBe(1)
    })
})

describe('Project methods exist #exists_unit',()=>{
    it('createProject method exists', () => {
        expect(dbController.createProject).toBeInstanceOf(Function)
    })
    it('assignToolToProject method exists', () => {
        expect(dbController.assignToolToProject).toBeInstanceOf(Function)
    })
    it('grantGroupAccessToProject method exists', () => {
        expect(dbController.grantGroupAccessToProject).toBeInstanceOf(Function)
    })
})

// Add more tests for the remaining methods...
