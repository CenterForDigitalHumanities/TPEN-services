import { validateProjectPayload } from "../../../utilities/validatePayload.js"
import Project from "../Project.js";
import dbDriver from "../../../database/driver.js"
import { sendMail } from "../../../utilities/mailer/index.js"
import User from "../../User/User.js";
import Group from "../../Group/Group.js"
import { jest } from "@jest/globals";

jest.mock("../../../database/driver.js", () => {
  return {
    save: jest.fn(),
    remove: jest.fn().mockResolvedValue({ _id: "deleted" }),
  };
});
jest.mock("../../../utilities/mailer/index.js");
jest.mock("../../../utilities/validatePayload.js", () => {
  return {
    validateProjectPayload: jest.fn(),
  };
});
jest.mock("../../User/User.js", () => {
  return {
    User: jest.fn().mockImplementation(() => {
      return {
        getByEmail: jest.fn(),
        save: jest.fn(),
      };
    }),
  };
});
jest.mock("../../Group/Group.js", () => {
  return jest.fn().mockImplementation(() => {
    return {
      addMember: jest.fn(),
      removeMember: jest.fn(),
    };
  });
});

describe("Project Class", () => {
  let project;

  beforeEach(() => {
    project = new Project();
  });

  test.skip("create method should save project", async () => {
    validatePayload.validateProjectPayload.mockReturnValue(true);
    dbDriver.save.mockResolvedValue({ _id: "newProjectId" });

    const result = await project.create({ name: "Test Project" });

    expect(validatePayload.validateProjectPayload).toHaveBeenCalledWith({ name: "Test Project" });
    expect(dbDriver.save).toHaveBeenCalledWith({ name: "Test Project" });
    expect(result).toEqual({ _id: "newProjectId" });
  });

  test.skip("delete method should remove project", async () => {
    const result = await project.delete("projectId");

    expect(dbDriver.remove).toHaveBeenCalledWith("projectId");
    expect(result).toEqual({ _id: "deleted" });
  });

});
