/**
 * This should test unit actions against the MongoDB Controller.
 *
 * @author Bryan Haberberger
 * https://github.com/thehabes
 */

import DatabaseController from "../controller.mjs"
const database = new DatabaseController()
const TIME_OUT = process.env.DB_TEST_TIMEOUT ?? 6500

let test_proj = { name: "Test Project"}
let test_group = {"@type": "Group", name: "Test Group"}
let test_user = {"@type": "User", name: "Test User"}

beforeAll(async () => {
  return await database.connect()
}, 10000)

afterAll(async () => {
  return await database.close()
}, 10000)

describe("Mongo Database Unit Functions. #mongo_unit #db", () => {
  it(
    "connects for an active connection",
    async () => {
      const result = await database.connected()
      expect(result).toBe(true)
    },
    TIME_OUT
  )

  it(
    "creates a new project",
    async () => {
      const result = await database.save(test_proj, "Project")
      test_proj["_id"] = result["_id"]
      expect(result["_id"]).toBeTruthy()
    },
    TIME_OUT
  )
  it(
    "creates a new group",
    async () => {
      const result = await database.save(test_group, "groups")
      test_group["_id"] = result["_id"]
      expect(result["_id"]).toBeTruthy()
    },
    TIME_OUT
  )
  it(
    "creates a new User",
    async () => {
      const result = await database.save(test_user, "users")
      test_user["_id"] = result["_id"]
      expect(result["_id"]).toBeTruthy()
    },
    TIME_OUT
  )

  it(
    "updates an existing project",
    async () => {
      test_proj.name = "Test Project -- Updated"
      const result = await database.update(test_proj, "Project")
      expect(result["_id"]).toBeTruthy()
    },
    TIME_OUT
  )
  it(
    "updates an existing group",
    async () => {
      test_group.name = "Test Group -- Updated"
      await database.save(test_group, "groups")
      const result = await database.update(test_group, "groups")
      expect(result["_id"]).toBeTruthy()
    },
    TIME_OUT
  )
  it(
    "updates an existing User",
    async () => {
      test_user.name = "Test User -- Updated"
      await database.save(test_user, "users")
      const result = await database.update(test_user, "users")
      expect(result["_id"]).toBeTruthy()
    },
    TIME_OUT
  )

  it(
    "Finds matching projects by query",
    async () => {
      const result = await database.find(test_proj, "Project")
      expect(result[0]["_id"]).toBe(test_proj["_id"])
    },
    TIME_OUT
  )
  it(
    "Finds matching groups by query",
    async () => {
      const result = await database.find(test_group, "groups")
      expect(result[0]["_id"]).toBe(test_group["_id"])
    },
    TIME_OUT
  )
  it(
    "Finds matching User by query",
    async () => {
      const result = await database.find(test_user, "users")
      expect(result[0]["_id"]).toBe(test_user["_id"])
    },
    TIME_OUT
  )

  //TODO
  it("Deletes an object with the provided id", async () => {
    expect(true).toBeTruthy()
  })
  it.skip("Validates a possible id string", () => {
    expect(database.isValidId(123)).toBeTruthy()
    expect(database.isValidId(-123)).toBeTruthy()
    expect(database.isValidId("123")).toBeTruthy()
    expect(database.isValidId({})).toBeFalsy()
    expect(database.isValidId("123abc123abc123abc123abc")).toBeTruthy()
    expect(database.isValidId("123abc123abc123abc123abcTooLong")).toBeFalsy()

    expect(database.asValidId(123)).toBe(123)
    expect(database.asValidId("123abc123abc123abc123abc")).toBe(
      "123abc123abc123abc123abc"
    )
    expect(database.asValidId({})).toBe("000000000000000000becbec")
    expect(database.asValidId(-123)).toBe(-123)
  })
})

describe.skip("Mongo Database Unit Functions. #mongo_unit #db", () => {
  it("connects for an active connection", async () => {
    const result = await database.connected()
    expect(result).toBe(true)
  })
  it("creates a new project", async () => {
    const result = await database.save(test_proj, "Project")
    test_proj["_id"] = result["_id"]
    expect(result["_id"]).toBeTruthy()
  })
  it("creates a new group", async () => {
    const result = await database.save(test_group)
    test_group["_id"] = result["_id"]
    expect(result["_id"]).toBeTruthy()
  })
  it("creates a new User", async () => {
    const result = await database.save(test_user)
    test_user["_id"] = result["_id"]
    expect(result["_id"]).toBeTruthy()
  })

  it("updates an existing project", async () => {
    test_proj.name = "Test Project -- Updated"
    const result = await database.update(test_proj, "Project")
    expect(result["_id"]).toBeTruthy()
  })
  it("updates an existing group", async () => {
    test_group.name = "Test Group -- Updated"
    const result = await database.update(test_group)
    expect(result["_id"]).toBeTruthy()
  })
  it("updates an existing User", async () => {
    test_user.name = "Test User -- Updated"
    const result = await database.update(test_user)
    expect(result["_id"]).toBeTruthy()
  })

  it("Finds matching projects by query", async () => {
    const result = await database.find(test_proj, "Project")
    expect(result[0]["_id"]).toBe(test_proj["_id"])
  })
  it("Finds matching groups by query", async () => {
    const result = await database.find(test_group)
    expect(result[0]["_id"]).toBe(test_group["_id"])
  })
  it("Finds matching User by query", async () => {
    const result = await database.find(test_user)
    expect(result[0]["_id"]).toBe(test_user["_id"])
  })

  //TODO
  it("Deletes an object with the provided id", async () => {
    expect(true).toBeTruthy()
  })
})

describe("Mongo Database Utilities. #mongo_unit #db", () => {
  it("Assigns a new id for an Object", async () => {
    const noSeedResult = database.reserveId()
    const badSeedResult = database.reserveId("🕵️‍♀️🍤")
    const goodSeedResult = database.reserveId(500)
    const exactSeedResult = database.reserveId("662bceca0b2fbab1bb0c6d4f")
    expect(typeof noSeedResult).toEqual("string")
    expect(noSeedResult).toHaveLength(24)
    expect(typeof badSeedResult).toEqual("string")
    expect(badSeedResult).toHaveLength(24)
    expect(typeof goodSeedResult).toEqual("string")
    expect(goodSeedResult).toHaveLength(24)
    expect(exactSeedResult).toEqual("662bceca0b2fbab1bb0c6d4f")
  })
})
