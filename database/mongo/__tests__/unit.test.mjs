import {default as DatabaseController} from '../index.mjs'

// If tests run independent of app.js, then the test needs to register the .env middleware
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
let storedEnv = dotenv.config()
dotenvExpand.expand(storedEnv)

const dbController = new DatabaseController(process.env.MONGODB)

beforeAll(async () => {
   return await dbController.connect()
})

afterAll(async () => {
   return await dbController.close()
})

describe('Project collection methods #functions_unit #db',()=>{
    it('creates a new project', async () => {
        const project = { name: 'Test Project', description: 'This is a test project.' }
        const result = await dbController.createProject(project)
        expect(result.insertedId).toBeTruthy()
    })
    
    it('assigns a new tool to the project', async () => {
        const projectId = 'your-project-id'
        const tool = { name: 'Test Tool', version: '1.0.0' }
        const result = await dbController.assignToolToProject(projectId, tool)
        expect(result.acknowledged).toBe(true)
    })
    
    it('grants a group access to the project', async () => {
        const projectId = 'your-project-id'
        const groupId = 'your-group-id'
        const result = await dbController.grantGroupAccessToProject(projectId, groupId)
        expect(result.acknowledged).toBe(true)
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
