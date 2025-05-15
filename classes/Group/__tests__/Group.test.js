import Group from "../Group.js"
import dbDriver from "../../../database/driver.js"
import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert'

// Manual mock for dbDriver
class MockDbDriver {
  constructor(type) {}
  reserveId() { return "01234567890123456789abcd" }
  save() { return Promise.resolve("newGroup") }
}

describe("Group Class", () => {
  let group
  let databaseMock

  beforeEach(() => {
    databaseMock = new MockDbDriver("mongo")
    group = new Group()
    group.members = {
      member1: { roles: ["role1"] },
      member2: { roles: ["role2"] },
      member3: { roles: ["role2", "role1"] }
    }
  })

  test("should add a new member", async () => {
    await group.addMember("member4", ["role1"])
    assert.ok(group.members["member4"])
    assert.deepStrictEqual(group.members["member4"].roles, ["role1"])
  })

  test("should throw error when adding an existing member", async () => {
    await assert.rejects(async () => {
      await group.addMember("member1", ["role2"])
    }, /Member already exists/)
  })

  test("should update member roles", () => {
    group.setMemberRoles("member1", ["role2"])
    assert.deepStrictEqual(group.members["member1"].roles, ["role2"])
  })

  test("should throw error when updating non-existing member", () => {
    assert.throws(() => group.setMemberRoles("nobody", ["role2"]), /Member not found/)
  })

  test("should add roles to an existing member", () => {
    group.addMemberRoles("member1", ["role2"])
    assert.deepStrictEqual(group.members["member1"].roles, ["role1", "role2"])
  })

  test("should remove roles from an existing member", () => {
    group.members["member1"] = { roles: ["role1", "role2"] }
    group.removeMemberRoles("member1", ["role1"])
    assert.deepStrictEqual(group.members["member1"].roles, ["role2"])
  })

  test("should remove a member", async () => {
    await group.removeMember("member1")
    assert.strictEqual(group.members["member1"], undefined)
  })

  test("should get members by role", () => {
    group.members["member1"] = { roles: ["role1"] }
    group.members["member2"] = { roles: ["role2"] }
    assert.deepStrictEqual(group.getByRole("role1"), ["member1", "member3"])
  })

  test("should create a new group", async () => {
    // Use the mock driver
    const payload = { label: "Test Group" }
    const result = await Group.createNewGroup("01234567890123456789abcd", payload)
    assert.strictEqual(result.creator, "01234567890123456789abcd")
    assert.strictEqual(result.label, "Test Group")
    assert.ok(result.members['01234567890123456789abcd'])
    assert.deepStrictEqual(result.members['01234567890123456789abcd'].roles, ["OWNER", "LEADER"])
  })
})
