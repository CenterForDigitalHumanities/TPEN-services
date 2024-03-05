import DatabaseController from './DatabaseController'

const dbController = new DatabaseController('your-mongodb-connection-string')

beforeAll(async () => {
    await dbController.connect()
})

afterAll(async () => {
    await dbController.close()
})

test('create a new project', async () => {
    const project = { name: 'Test Project', description: 'This is a test project.' }
    const result = await dbController.createProject(project)
    expect(result.insertedCount).toBe(1)
})

test('assign a new tool to the project', async () => {
    const projectId = 'your-project-id'
    const tool = { name: 'Test Tool', version: '1.0.0' }
    const result = await dbController.assignToolToProject(projectId, tool)
    expect(result.modifiedCount).toBe(1)
})

test('grant a group access to the project', async () => {
    const projectId = 'your-project-id'
    const groupId = 'your-group-id'
    const result = await dbController.grantGroupAccessToProject(projectId, groupId)
    expect(result.modifiedCount).toBe(1)
})

// Add more tests for the remaining methods...
