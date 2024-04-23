/**
 * This should test unit actions against the MongoDB Controller.
 *
 * @author Bryan Haberberger
 * https://github.com/thehabes
 */

import DatabaseController from "../controller.mjs"
const database = new DatabaseController()
const timeOut = process.env.DB_TEST_TIMEOUT ?? 6500

let test_proj = {"@type": "Project", name: "Test Project"}
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
    timeOut
  )

  it(
    "creates a new project",
    async () => {
      const result = await database.save(test_proj)
      test_proj["_id"] = result["_id"]
      expect(result["_id"]).toBeTruthy()
    },
    timeOut
  )
  it(
    "creates a new group",
    async () => {
      const result = await database.save(test_group)
      test_group["_id"] = result["_id"]
      expect(result["_id"]).toBeTruthy()
    },
    timeOut
  )
  it(
    "creates a new User",
    async () => {
      const result = await database.save(test_user)
      test_user["_id"] = result["_id"]
      expect(result["_id"]).toBeTruthy()
    },
    timeOut
  )

  it(
    "updates an existing project",
    async () => {
      test_proj.name = "Test Project -- Updated"
      const result = await database.update(test_proj)
      expect(result["_id"]).toBeTruthy()
    },
    timeOut
  )
  it(
    "updates an existing group",
    async () => {
      test_group.name = "Test Group -- Updated"
      const result = await database.update(test_group)
      expect(result["_id"]).toBeTruthy()
    },
    timeOut
  )
  it(
    "updates an existing User",
    async () => {
      test_user.name = "Test User -- Updated"
      const result = await database.update(test_user)
      expect(result["_id"]).toBeTruthy()
    },
    timeOut
  )

  it(
    "Finds matching projects by query",
    async () => {
      const result = await database.find(test_proj)
      expect(result[0]["_id"]).toBe(test_proj["_id"])
    },
    timeOut
  )
  it(
    "Finds matching groups by query",
    async () => {
      const result = await database.find(test_group)
      expect(result[0]["_id"]).toBe(test_group["_id"])
    },
    timeOut
  )
  it(
    "Finds matching User by query",
    async () => {
      const result = await database.find(test_user)
      expect(result[0]["_id"]).toBe(test_user["_id"])
    },
    timeOut
  )

  //TODO
  it("Deletes an object with the provided id", async () => {
    expect(true).toBeTruthy()
  })
})

describe('Mongo Database Unit Functions. #mongo_unit #db', () => {
    it('connects for an active connection', async () => {
        const result = await database.connected()
        expect(result).toBe(true)
    })
    it('creates a new project', async () => {
        const result = await database.save(test_proj)
        test_proj["_id"] = result["_id"]
        expect(result["_id"]).toBeTruthy()
    })
    it('creates a new group', async () => {
        const result = await database.save(test_group)
        test_group["_id"] = result["_id"]
        expect(result["_id"]).toBeTruthy()
    })
    it('creates a new User', async () => {
        const result = await database.save(test_user)
        test_user["_id"] = result["_id"]
        expect(result["_id"]).toBeTruthy()
    })

    it('updates an existing project', async () => {
        test_proj.name = "Test Project -- Updated"
        const result = await database.update(test_proj)
        expect(result["_id"]).toBeTruthy()
    })
    it('updates an existing group', async () => {
        test_group.name = "Test Group -- Updated"
        const result = await database.update(test_group)
        expect(result["_id"]).toBeTruthy()
    })
    it('updates an existing User', async () => {
        test_user.name = "Test User -- Updated"
        const result = await database.update(test_user)
        expect(result["_id"]).toBeTruthy()
    })

    it('Finds matching projects by query', async () => {
        const result = await database.find(test_proj)
        expect(result[0]["_id"]).toBe(test_proj["_id"])
    })
    it('Finds matching groups by query', async () => {
        const result = await database.find(test_group)
        expect(result[0]["_id"]).toBe(test_group["_id"])
    })
    it('Finds matching User by query', async () => {
        const result = await database.find(test_user)
        expect(result[0]["_id"]).toBe(test_user["_id"])
    })

    //TODO
    it('Deletes an object with the provided id', async () => {
        expect(true).toBeTruthy()
    })

    it('Validates a possible id string', () => {
        expect(database.isValidId(123)).toBeTruthy()
        expect(database.isValidId(-123)).toBeTruthy()
        expect(database.isValidId("123")).toBeTruthy()
        expect(database.isValidId({})).toBeFalsy()
        expect(database.isValidId('123abc123abc123abc123abc')).toBeTruthy()
        expect(database.isValidId('123abc123abc123abc123abcTooLong')).toBeFalsy()

        expect(database.asValidId(123)).toBe(123)
        expect(database.asValidId('123abc123abc123abc123abc')).toBe('123abc123abc123abc123abc')
        expect(database.asValidId({})).toBe('000000000000000000becbec')
        expect(database.asValidId(-123)).toBe(-123)
    })
})
