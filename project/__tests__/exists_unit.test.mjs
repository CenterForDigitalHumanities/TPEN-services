import projectRouter from '../index.mjs'
import { test } from 'node:test'
import assert from 'node:assert'

const app = { _router: { stack: projectRouter.stack } }

test("Project endpoint availability unit test (via a check on the app routes). #exists_unit", (t) => {
  t.test("responds to /project/id", () => {
    const stack = app._router.stack
    assert.strictEqual(stack.some(middleware => middleware.route && middleware.route.methods.get && middleware.regexp.toString().includes("/")), true)
    assert.strictEqual(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes("/create")), true)
    assert.strictEqual(stack.some(middleware => middleware.route && middleware.route.methods.post && middleware.regexp.toString().includes("/import")), true)
  })
})

test("Hotkeys endpoint availability unit test (via a check on the app routes). #exists_unit #options", (t) => {
  t.test("responds to /project/id/hotkeys", () => {
    const stack = app._router.stack
    assert.strictEqual(stack.some(middleware => middleware.route && middleware.route.methods.get && middleware.regexp.toString().includes("/hotkeys")), true)
    assert.strictEqual(stack.some(middleware => middleware.route && middleware.route.methods.put && middleware.regexp.toString().includes("/hotkeys")), true)
    assert.strictEqual(stack.some(middleware => middleware.route && middleware.route.methods.delete && middleware.regexp.toString().includes("/hotkeys")), true)
  })
})
