import Group from "../Group.mjs"
import dbDriver from "../../../database/driver.mjs"
import { expect, jest } from "@jest/globals"

jest.mock("../../../database/driver.mjs")

describe("Group Class", () => {
    let group
    let databaseMock

    beforeEach(() => {
        databaseMock = new dbDriver("mongo")
        group = new Group()
        group.members = { member1 : {roles: ["role1"]}, 
            member2 : {roles: ["role2"]},
            member3 : {roles: ["role2", "role1"]} 
        }
    })

    test("should add a new member", () => {
        group.addMember("member4", ["role1"])
        expect(group.members["member4"]).toBeTruthy()
        expect(group.members["member4"].roles).toEqual(["role1"])
    })

    test("should throw error when adding an existing member", () => {
        expect(() => group.addMember("member1", ["role2"])).toThrow("Member already exists")
    })

    test("should update member roles", () => {
        group.updateMember("member1", ["role2"])
        expect(group.members["member1"].roles).toEqual(["role2"])
    })

    test("should throw error when updating non-existing member", () => {
        expect(() => group.updateMember("nobody", ["role2"])).toThrow("Member not found")
    })

    test("should add roles to an existing member", () => {
        group.addMemberRoles("member1", ["role2"])
        expect(group.members["member1"].roles).toEqual(["role1", "role2"])
    })

    test("should remove roles from an existing member", () => {
        group.members["member1"] = { roles: ["role1", "role2"] }
        group.removeMemberRoles("member1", ["role1"])
        expect(group.members["member1"].roles).toEqual(["role2"])
    })

    test("should remove a member", () => {
        group.removeMember("member1")
        expect(group.members["member1"]).toBeUndefined()
    })

    test("should get members by role", () => {
        group.members["member1"] = { roles: ["role1"] }
        group.members["member2"] = { roles: ["role2"] }
        expect(group.getByRole("role1")).toEqual(["member1","member3"])
    })

    test("should create a new group", async () => {
        databaseMock.reserveId = jest.fn().mockReturnValue("01234567890123456789abcd")
        databaseMock.save = jest.fn().mockResolvedValue("newGroup")
        const payload = { label: "Test Group" }
        const result = await Group.createNewGroup("01234567890123456789abcd", payload)
        expect(result.creator).toBe("01234567890123456789abcd")
        expect(result.label).toBe("Test Group")
        expect(result.members['01234567890123456789abcd']).toBeDefined()
        expect(result.members['01234567890123456789abcd'].roles).toEqual(["OWNER", "LEADER"])
    })
})
