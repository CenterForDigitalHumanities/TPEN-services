import { test, describe, before, after, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import projectRouter from '../index.js'

const app = { _router: { stack: projectRouter.stack } }

describe('Project endpoint availability unit test (via a check on the app routes)', () => {
  test('responds to /project/:id', (t) => {
    const stack = app._router.stack
    assert.ok(stack.some(middleware => middleware.route && middleware.route.methods.get && middleware.regexp.toString().includes("/project/([^/]+?)")))
    assert.ok(stack.some(middleware => middleware.route && middleware.route.methods.get && middleware.regexp.toString().includes(":id/manifest")))
    assert.ok(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes("/create")))
    assert.ok(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes("/import")))
    assert.ok(stack.some(middleware => middleware.route && middleware.route.methods.get && middleware.regexp.toString().includes("/import28/")))
  })
})

describe('Hotkeys endpoint availability unit test (via a check on the app routes)', () => {
  test('responds to /project/:id/hotkeys', (t) => {
    const stack = app._router.stack
    const hotkeysPattern = "/project/([^/]+?)/hotkeys"
    assert.ok(stack.some(middleware => middleware.route && middleware.route.methods.get && middleware.regexp.toString().includes(hotkeysPattern)))
    assert.ok(stack.some(middleware => middleware.route && middleware.route.methods.put && middleware.regexp.toString().includes(hotkeysPattern)))
    assert.ok(stack.some(middleware => middleware.route && middleware.route.methods.delete && middleware.regexp.toString().includes(hotkeysPattern)))
    assert.ok(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes(hotkeysPattern)))
  })
})

describe('Member and collaborator endpoint availability', () => {
  test('responds to /project/:id/invite-member and /project/:id/remove-member', (t) => {
    const stack = app._router.stack
    const invitePattern = "/project/([^/]+?)/invite-member"
    const removePattern = "/project/([^/]+?)/remove-member"
    assert.ok(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes(invitePattern)))
    assert.ok(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes(removePattern)))
  })
  test('responds to /project/:projectId/collaborator/:collaboratorId/addRoles, setRoles, removeRoles', (t) => {
    const stack = app._router.stack
    const addRolesPattern = "/project/([^/]+?)/collaborator/([^/]+?)/addRoles"
    const setRolesPattern = "/project/([^/]+?)/collaborator/([^/]+?)/setRoles"
    const removeRolesPattern = "/project/([^/]+?)/collaborator/([^/]+?)/removeRoles"
    assert.ok(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes(addRolesPattern)))
    assert.ok(stack.some(middleware => middleware.route && middleware.route.methods.put && middleware.regexp.toString().includes(setRolesPattern)))
    assert.ok(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes(removeRolesPattern)))
  })
  test('responds to /project/:projectId/switch/owner', (t) => {
    const stack = app._router.stack
    assert.ok(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes("/switch/owner")))
  })
})

describe('Custom roles endpoint availability', () => {
  test('responds to /project/:projectId/addCustomRoles, setCustomRoles, removeCustomRoles', (t) => {
    const stack = app._router.stack
    const addCustomRolesPattern = "/project/([^/]+?)/addCustomRoles"
    const setCustomRolesPattern = "/project/([^/]+?)/setCustomRoles"
    const removeCustomRolesPattern = "/project/([^/]+?)/removeCustomRoles"
    assert.ok(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes(addCustomRolesPattern)))
    assert.ok(stack.some(middleware => middleware.route && middleware.route.methods.put && middleware.regexp.toString().includes(setCustomRolesPattern)))
    assert.ok(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes(removeCustomRolesPattern)))
  })
})

describe('Project metadata endpoint availability', () => {
  test('responds to /project/:projectId/metadata', (t) => {
    const stack = app._router.stack
    const metadataPattern = "/project/([^/]+?)/metadata"
    assert.ok(stack.some(middleware => middleware.route && middleware.route.methods.put && middleware.regexp.toString().includes(metadataPattern)))
  })
})

describe('Layer and page nested route availability', () => {
  test('responds to /project/:projectId/layer and /project/:projectId/page', (t) => {
    const stack = app._router.stack
    assert.ok(stack.some(middleware => middleware.name === 'router' && middleware.regexp.toString().includes("/layer")))
    assert.ok(stack.some(middleware => middleware.name === 'router' && middleware.regexp.toString().includes("/page")))
  })
})
