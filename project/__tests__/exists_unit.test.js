import projectRouter from '../index.js'
import { jest } from '@jest/globals'
import assert from 'node:assert'

const app = { _router: { stack: projectRouter.stack } }

describe("Project endpoint availability unit test (via a check on the app routes)", () => {
  test("responds to /project/:id", () => {
    const stack = app._router.stack
    // Looser check for :id route (Express regex is complex)
    // Express compiles /project/:id to /project/([^/]+?)(?:/)?$/
    expect(stack.some(middleware => middleware.route && middleware.route.methods.get && middleware.regexp.toString().includes("/project/([^/]+?)"))).toBe(true)
    expect(stack.some(middleware => middleware.route && middleware.route.methods.get && middleware.regexp.toString().includes(":id/manifest"))).toBe(true)
    expect(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes("/create"))).toBe(true)
    expect(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes("/import"))).toBe(true)
    expect(stack.some(middleware => middleware.route && middleware.route.methods.get && middleware.regexp.toString().includes("/import28/"))).toBe(true)
  })
})

describe("Hotkeys endpoint availability unit test (via a check on the app routes)", () => {
  test("responds to /project/:id/hotkeys", () => {
    const stack = app._router.stack
    // Express compiles /project/:id/hotkeys to /project/([^/]+?)/hotkeys
    const hotkeysPattern = "/project/([^/]+?)/hotkeys"
    expect(stack.some(middleware => middleware.route && middleware.route.methods.get && middleware.regexp.toString().includes(hotkeysPattern))).toBe(true)
    expect(stack.some(middleware => middleware.route && middleware.route.methods.put && middleware.regexp.toString().includes(hotkeysPattern))).toBe(true)
    expect(stack.some(middleware => middleware.route && middleware.route.methods.delete && middleware.regexp.toString().includes(hotkeysPattern))).toBe(true)
    expect(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes(hotkeysPattern))).toBe(true)
  })
})

describe("Member and collaborator endpoint availability", () => {
  test("responds to /project/:id/invite-member and /project/:id/remove-member", () => {
    const stack = app._router.stack
    const invitePattern = "/project/([^/]+?)/invite-member"
    const removePattern = "/project/([^/]+?)/remove-member"
    expect(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes(invitePattern))).toBe(true)
    expect(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes(removePattern))).toBe(true)
  })
  test("responds to /project/:projectId/collaborator/:collaboratorId/addRoles, setRoles, removeRoles", () => {
    const stack = app._router.stack
    const addRolesPattern = "/project/([^/]+?)/collaborator/([^/]+?)/addRoles"
    const setRolesPattern = "/project/([^/]+?)/collaborator/([^/]+?)/setRoles"
    const removeRolesPattern = "/project/([^/]+?)/collaborator/([^/]+?)/removeRoles"
    expect(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes(addRolesPattern))).toBe(true)
    expect(stack.some(middleware => middleware.route && middleware.route.methods.put && middleware.regexp.toString().includes(setRolesPattern))).toBe(true)
    expect(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes(removeRolesPattern))).toBe(true)
  })
  test("responds to /project/:projectId/switch/owner", () => {
    const stack = app._router.stack
    expect(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes("/switch/owner"))).toBe(true)
  })
})

describe("Custom roles endpoint availability", () => {
  test("responds to /project/:projectId/addCustomRoles, setCustomRoles, removeCustomRoles", () => {
    const stack = app._router.stack
    expect(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes("/addCustomRoles"))).toBe(true)
    expect(stack.some(middleware => middleware.route && middleware.route.methods.put && middleware.regexp.toString().includes("/setCustomRoles"))).toBe(true)
    expect(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes("/removeCustomRoles"))).toBe(true)
  })
})

describe("Project metadata endpoint availability", () => {
  test("responds to /project/:projectId/metadata", () => {
    const stack = app._router.stack
    expect(stack.some(middleware => middleware.route && middleware.route.methods.put && middleware.regexp.toString().includes("/metadata"))).toBe(true)
  })
})

describe("Layer and page nested route availability", () => {
  test("responds to /project/:projectId/layer and /project/:projectId/page", () => {
    const stack = app._router.stack
    expect(stack.some(middleware => middleware.name === 'router' && middleware.regexp.toString().includes("/layer"))).toBe(true)
    expect(stack.some(middleware => middleware.name === 'router' && middleware.regexp.toString().includes("/page"))).toBe(true)
  })
})
