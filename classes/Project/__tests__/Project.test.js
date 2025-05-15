import Project from '../Project.js'
import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert'

// Manual stubs for dependencies
const mockSave = async (data) => ({ _id: 'newProjectId' })
const mockRemove = async (id) => ({ _id: 'deleted' })
const mockValidateProjectPayload = (data) => true

// Patch Project's dependencies for testing
Project.prototype._db = { save: mockSave, remove: mockRemove }
Project.prototype._validate = mockValidateProjectPayload

describe('Project Class', () => {
  let project

  beforeEach(() => {
    project = new Project()
  })

  test('create method should save project', async () => {
    const result = await project.create({ name: 'Test Project' })
    assert.deepStrictEqual(result, { _id: 'newProjectId' })
  })

  test('delete method should remove project', async () => {
    const result = await project.delete('projectId')
    assert.deepStrictEqual(result, { _id: 'deleted' })
  })
})
