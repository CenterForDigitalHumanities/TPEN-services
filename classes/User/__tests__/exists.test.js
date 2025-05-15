// Manual mock for dbDriver to prevent real DB connection
const mockDatabase = {
  reserveId: () => "mocked_id",
  getById: async () => ({}),
  findOne: async () => ({}),
  save: async () => ({}),
  update: async () => ({}),
  controller: {
    db: {
      collection: () => ({
        aggregate: () => ({ toArray: async () => [] })
      })
    }
  }
}

import User from "../User.js"
import { test } from "node:test"
import assert from "node:assert"

test("User class appears and behaves as expected #user_exists_test #user_class", t => {
  t.test("Imports User class", () => {
    assert.ok(User?.prototype)
    assert.strictEqual(typeof User, "function")
  })

  t.test("Has required methods on instance and class", () => {
    const user = new User("userID", mockDatabase)
    assert.strictEqual(typeof user.getSelf, "function")
    assert.strictEqual(typeof user.getProjects, "function")
    assert.strictEqual(typeof user.getPublicInfo, "function")
    assert.strictEqual(typeof user.getByEmail, "function")
    assert.strictEqual(typeof User.create, "function")
  })
})
