import projectRouter from '../index.js'
import { jest } from '@jest/globals'

const app = { _router: { stack: projectRouter.stack } }

describe.skip("Project endpoint availability unit test (via a check on the app routes)", () => {
  test("responds to /project/:id", () => {
    const stack = app._router.stack
    // Use .test() with sample paths to check route regexes
    expect(stack.some(mw => mw.route?.methods?.get && mw.regexp?.test('/project/123'))).toBe(true)
    expect(stack.some(mw => mw.route?.methods?.get && mw.regexp?.test('/project/123/manifest'))).toBe(true)
    expect(stack.some(mw => mw.route?.methods?.post && mw.regexp?.test('/project/create'))).toBe(true)
    expect(stack.some(mw => mw.route?.methods?.post && mw.regexp?.test('/project/import'))).toBe(true)
    expect(stack.some(mw => mw.route?.methods?.get && mw.regexp?.test('/project/import28/'))).toBe(true)
  })
})

describe.skip("Hotkeys endpoint availability unit test (via a check on the app routes)", () => {
  test("responds to /project/:id/hotkeys", () => {
    const stack = app._router.stack
    expect(stack.some(mw => mw.route?.methods?.get && mw.regexp?.test('/project/123/hotkeys'))).toBe(true)
    expect(stack.some(mw => mw.route?.methods?.put && mw.regexp?.test('/project/123/hotkeys'))).toBe(true)
    expect(stack.some(mw => mw.route?.methods?.delete && mw.regexp?.test('/project/123/hotkeys'))).toBe(true)
    expect(stack.some(mw => mw.route?.methods?.post && mw.regexp?.test('/project/123/hotkeys'))).toBe(true)
  })
})

describe.skip("Member and collaborator endpoint availability", () => {
  test("responds to /project/:id/invite-member and /project/:id/remove-member", () => {
    const stack = app._router.stack
    expect(stack.some(mw => mw.route?.methods?.post && mw.regexp?.test('/project/123/invite-member'))).toBe(true)
    expect(stack.some(mw => mw.route?.methods?.post && mw.regexp?.test('/project/123/remove-member'))).toBe(true)
  })
  test("responds to /project/:projectId/collaborator/:collaboratorId/addRoles, setRoles, removeRoles", () => {
    const stack = app._router.stack
    expect(stack.some(mw => mw.route?.methods?.post && mw.regexp?.test('/project/123/collaborator/456/addRoles'))).toBe(true)
    expect(stack.some(mw => mw.route?.methods?.put && mw.regexp?.test('/project/123/collaborator/456/setRoles'))).toBe(true)
    expect(stack.some(mw => mw.route?.methods?.post && mw.regexp?.test('/project/123/collaborator/456/removeRoles'))).toBe(true)
  })
  test("responds to /project/:projectId/switch/owner", () => {
    const stack = app._router.stack
    expect(stack.some(mw => mw.route?.methods?.post && mw.regexp?.test('/project/123/switch/owner'))).toBe(true)
  })
})

describe.skip("Custom roles endpoint availability", () => {
  test("responds to /project/:projectId/addCustomRoles, setCustomRoles, removeCustomRoles", () => {
    const stack = app._router.stack
    expect(stack.some(mw => mw.route?.methods?.post && mw.regexp?.test('/project/123/addCustomRoles'))).toBe(true)
    expect(stack.some(mw => mw.route?.methods?.put && mw.regexp?.test('/project/123/setCustomRoles'))).toBe(true)
    expect(stack.some(mw => mw.route?.methods?.post && mw.regexp?.test('/project/123/removeCustomRoles'))).toBe(true)
  })
})

describe.skip("Project metadata endpoint availability", () => {
  test("responds to /project/:projectId/metadata", () => {
    const stack = app._router.stack
    expect(stack.some(mw => mw.route?.methods?.put && mw.regexp?.test('/project/123/metadata'))).toBe(true)
  })
})

describe.skip("Layer and page nested route availability", () => {
  test("responds to /project/:projectId/layer and /project/:projectId/page", () => {
    const stack = app._router.stack
    expect(stack.some(mw => mw.name === 'router' && mw.regexp?.test('/project/123/layer'))).toBe(true)
    expect(stack.some(mw => mw.name === 'router' && mw.regexp?.test('/project/123/page'))).toBe(true)
  })
})
