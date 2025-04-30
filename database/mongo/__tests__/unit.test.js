/**
 * This should test unit actions against the MongoDB Controller.
 *
 * @author Bryan Haberberger
 * https://github.com/thehabes
 */

import DatabaseController from "../controller.js"
const database = new DatabaseController()
const TIME_OUT = process.env.DB_TEST_TIMEOUT ?? 6500

let test_proj = {
  name: "Test Project",
  group: "Test Group",
  metadata: [],
  layers: [],
  label: "Test Label",
  manifest: ["Test Manifest"],
  creator: "Test Creator"
}
let test_group = {"@type": "Group", name: "Test Group", members: []}
let test_user = {"@type": "User", name: "Test User", _sub: `auth${Date.now().toString().slice(-8)}`, agent: `agent${Date.now().toString().slice(-8)}`}

// Initialize the IDs to null to avoid cleanup attempts of non-existent objects
test_proj._id = null
test_group._id = null
test_user._id = null

beforeAll(async () => {
  return await database.connect()
}, 10000)

afterAll(async () => {
  // Only attempt to remove objects if they have valid IDs
  const testObjects = [
    { obj: test_proj, collection: "project" },
    { obj: test_group, collection: "groups" },
    { obj: test_user, collection: "users" }
  ]
  const cleanupPromises = testObjects
    .filter(({ obj }) => obj._id)
    .map(({ obj, collection }) => database.remove(obj._id, collection))
  await Promise.all(cleanupPromises)
  await database.close()
  return 
}, 10000)

describe.skip("Mongo Database Unit Functions. #mongo_unit #db", () => {
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
      test_proj._id = result._id
      expect(result._id).toBeTruthy()
    },
    TIME_OUT
  )
  
  it(
    "creates a new group",
    async () => {
      const result = await database.save(test_group, "groups")
      test_group._id = result._id
      expect(result._id).toBeTruthy()
    },
    TIME_OUT
  )
  
  it(
    "creates a new User",
    async () => {
      const result = await database.save(test_user, "users")
      test_user._id = result._id
      expect(result._id).toBeTruthy()
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
      await database.update(test_group, "groups")
      const result = await database.update(test_group, "groups")
      expect(result["_id"]).toBeTruthy()
    },
    TIME_OUT
  )
  it(
    "updates an existing User",
    async () => {
      test_user.name = "Test User -- Updated"
      await database.update(test_user, "users")
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
  it("Validates a possible id string", () => {
    expect(database.isValidId(123)).toBeTruthy()
    expect(database.isValidId(-123)).toBeTruthy()
    expect(database.isValidId("123")).toBeTruthy()
    expect(database.isValidId({})).toBeFalsy()
    expect(database.isValidId("123abc123abc123abc123abc")).toBeTruthy()

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
    const newId = database.reserveId()
    expect(typeof newId).toEqual("string")
    expect(newId).toHaveLength(24)
  })
})
