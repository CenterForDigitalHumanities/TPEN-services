import projectRouter from '../index.js'
import { jest } from '@jest/globals'
import assert from 'node:assert'

const app = { _router: { stack: projectRouter.stack } }

describe("Project endpoint availability unit test (via a check on the app routes)", () => {
  test("responds to /project/id", () => {
    const stack = app._router.stack
    expect(stack.some(middleware => middleware.route && middleware.route.methods.get && middleware.regexp.toString().includes("/"))).toBe(true)
    expect(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes("/create"))).toBe(true)
    expect(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes("/import"))).toBe(true)
  })
})

describe("Hotkeys endpoint availability unit test (via a check on the app routes)", () => {
  test("responds to /project/id/hotkeys", () => {
    const stack = app._router.stack
    expect(stack.some(middleware => middleware.route && middleware.route.methods.get && middleware.regexp.toString().includes("/hotkeys"))).toBe(true)
    expect(stack.some(middleware => middleware.route && middleware.route.methods.put && middleware.regexp.toString().includes("/hotkeys"))).toBe(true)
    expect(stack.some(middleware => middleware.route && middleware.route.methods.delete && middleware.regexp.toString().includes("/hotkeys"))).toBe(true)
  })
})
