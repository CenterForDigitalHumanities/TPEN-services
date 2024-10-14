import Group from "../Group.mjs"
import dbDriver from "../../database/driver.mjs"
import { jest } from "@jest/globals"

jest.mock("../../database/driver.mjs")

describe("Group Class", () => {
    let group
    let databaseMock

    beforeEach(() => {
        databaseMock = new dbDriver("mongo")
        group = new Group("testGroupId")
        group.members = {}
    })

    test("should add a new member", () => {
        group.addMember("member1", ["role1"])
        expect(group.members["member1"]).toBeTruthy()
        expect(group.members["member1"].roles).toEqual(["role1"])
    })

    test("should throw error when adding an existing member", () => {
        group.members["member1"] = { roles: ["role1"] }
        expect(() => group.addMember("member1", ["role2"])).toThrow("Member already exists")
    })

    test("should update member roles", () => {
        group.members["member1"] = { roles: ["role1"] }
        group.updateMember("member1", ["role2"])
        expect(group.members["member1"].roles).toEqual(["role2"])
    })

    test("should throw error when updating non-existing member", () => {
        expect(() => group.updateMember("member1", ["role2"])).toThrow("Member not found")
    })

    test("should add roles to an existing member", () => {
        group.members["member1"] = { roles: ["role1"] }
        group.addMemberRoles("member1", ["role2"])
        expect(group.members["member1"].roles).toEqual(["role1", "role2"])
    })

    test("should remove roles from an existing member", () => {
        group.members["member1"] = { roles: ["role1", "role2"] }
        group.removeMemberRoles("member1", ["role1"])
        expect(group.members["member1"].roles).toEqual(["role2"])
    })

    test("should remove a member", () => {
        group.members["member1"] = { roles: ["role1"] }
        group.removeMember("member1")
        expect(group.members["member1"]).toBeUndefined()
    })

    test("should get members by role", () => {
        group.members["member1"] = { roles: ["role1"] }
        group.members["member2"] = { roles: ["role2"] }
        expect(group.getByRole("role1")).toEqual(["member1"])
    })

    test("should save the group", async () => {
        databaseMock.save.mockResolvedValue(true)
        const result = await group.save()
        expect(result).toBe(true)
    })

    test("should create a new group", async () => {
        databaseMock.reserveId.mockReturnValue("newGroupId")
        databaseMock.save.mockResolvedValue(true)
        const payload = { customRoles: ["role1"], label: "Test Group", members: {} }
        const result = await Group.createNewGroup("creatorId", payload)
        expect(result).toBe(true)
    })
})
