import {expect} from "@jest/globals"
import {User} from "../User.mjs"

describe("User class constructor test #_unit #user_class", () => {
  describe("constructor", () => {
    it("should set the id property when provided an object", () => {
      const user = new User({_id: "123"})
      expect(user.id).toBe("123")
    })

    it("should set the id property when provided a string", () => {
      const user = new User("456")
      expect(user.id).toBe("456")
    })
  })
})

describe("User class methods #_unit #user_class", () => {
  describe("getSelf and getUserById", () => {
    it("should call getSelf and includeOnly with profile and _id", async () => {
      const user = new User({_id: "660d801652df1c2243d6d935"})
      const includedUser = await user.getUserById()
      expect(includedUser).toEqual({
        profile: expect.any(Object),
        _id: "660d801652df1c2243d6d935"
      })
    })

    it("should throw the error from getById", async () => {
      const user = new User({_id: "123"})
      const includedUser = await user.getUserById()
      expect(includedUser).toMatchObject({})
    })
  })

  describe("getProjects", () => {
    it("should call getSelf and includeOnly with profile and _id", async () => {
      const user = new User({_id: "660d801652df1c2243d6d935"})
      const userProjects = await user.getProjects()
      expect(userProjects).toBeInstanceOf(Array)
    })
  })
})
