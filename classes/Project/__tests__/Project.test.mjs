import Project from "../Project.mjs"
import dbDriver from "../../../database/driver.mjs"
import { sendMail } from "../../../utilities/mailer/index.mjs"
import { validateProjectPayload } from "../../../utilities/validatePayload.mjs"
import { User } from "../../User/User.mjs"
import Group from "../../Group/Group.mjs"
import { jest } from "@jest/globals"

jest.mock("../../../database/driver.mjs")
jest.mock("../../../utilities/mailer/index.mjs")
jest.mock("../../../utilities/validatePayload.mjs")
jest.mock("../../User/User.mjs")
jest.mock("../../Group/Group.mjs")

describe("Project Class unit tests #project_class", () => {
  let project
  let databaseMock

  beforeEach(() => {
    databaseMock = new dbDriver("mongo")
    project = new Project("testProjectId")
    project.data = { _id: "testProjectId", label: "Test Project", group: "testGroupId" }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test("should create a project successfully", async () => {
    validateProjectPayload.mockReturnValue({ isValid: true })
    databaseMock.save.mockResolvedValue("newProject")

    const payload = { label: "New Project" }
    const result = await project.create(payload)

    expect(result).toBe("newProject")
    expect(databaseMock.save).toHaveBeenCalledWith(payload)
  })

  test("should throw validation error when creating a project", async () => {
    validateProjectPayload.mockReturnValue({ isValid: false, errors: ["Invalid payload"] })

    const payload = { label: "New Project" }
    await expect(project.create(payload)).rejects.toEqual({ status: 400, message: ["Invalid payload"] })
  })

  test("should delete a project successfully", async () => {
    databaseMock.remove.mockResolvedValue("deletedProject")

    const result = await project.delete("testProjectId")

    expect(result).toBe("deletedProject")
    expect(databaseMock.remove).toHaveBeenCalledWith("testProjectId")
  })

  test("should throw error when deleting a project without ID", async () => {
    await expect(project.delete()).rejects.toEqual({ status: 400, message: "Project ID is required" })
  })

  test("should send invite to existing user", async () => {
    const userMock = new User()
    userMock.getByEmail.mockResolvedValue({ _id: "existingUserId" })
    Group.mockImplementation(() => ({
      addMember: jest.fn(),
      save: jest.fn()
    }))

    await project.sendInvite("test@example.com", "role1")

    expect(userMock.getByEmail).toHaveBeenCalledWith("test@example.com")
    expect(sendMail).toHaveBeenCalled()
  })

  test("should send invite to new user", async () => {
    const userMock = new User()
    userMock.getByEmail.mockResolvedValue(null)
    userMock.save.mockResolvedValue()
    Group.mockImplementation(() => ({
      addMember: jest.fn(),
      save: jest.fn()
    }))

    await project.sendInvite("newuser@example.com", "role1")

    expect(userMock.getByEmail).toHaveBeenCalledWith("newuser@example.com")
    expect(sendMail).toHaveBeenCalled()
  })

  test("should check user access", async () => {
    Group.mockImplementation(() => ({
      getMembers: jest.fn().mockReturnValue({
        "testUserId": { roles: ["role1"] }
      }),
      getPermissions: jest.fn().mockReturnValue({
        "role1": ["read_project", "write_project"]
      })
    }))

    const result = await project.checkUserAccess("testUserId", "read", "project", "entity")

    expect(result).toEqual({
      hasAccess: true,
      permissions: ["read_project", "write_project"],
      message: "User has access to the project."
    })
  })

  test("should remove a member successfully", async () => {
    Group.mockImplementation(() => ({
      removeMember: jest.fn(),
      save: jest.fn()
    }))

    await project.removeMember("testUserId")

    expect(Group.prototype.removeMember).toHaveBeenCalledWith("testUserId")
    expect(Group.prototype.save).toHaveBeenCalled()
  })

  test("should throw error when removing a member fails", async () => {
    Group.mockImplementation(() => ({
      removeMember: jest.fn().mockImplementation(() => {
        throw new Error("Remove member failed")
      }),
      save: jest.fn()
    }))

    await expect(project.removeMember("testUserId")).rejects.toEqual({
      status: 500,
      message: "An error occurred while removing the member."
    })
  })
})
