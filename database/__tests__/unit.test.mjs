/**
 * This should test that the Driver is put together and that its pices
 * map to the correct controllers.
 *
 * @author Bryan Haberberger
 * https://github.com/thehabes
 */

import DatabaseDriver from "../driver.mjs"
const timeOut = process.env.DB_TEST_TIMEOUT ?? 6500

describe("Driver CRUD and query is registered.  #driver_unit #db", () => {
  const d = new DatabaseDriver()
  it("create", async () => {
    expect(typeof d.save).toBe("function")
  })
  it("update", async () => {
    expect(typeof d.update).toBe("function")
  })
  it("delete", async () => {
    expect(typeof d.delete).toBe("function")
  })
  it("find", async () => {
    expect(typeof d.find).toBe("function")
  })
  it("choose controller", async () => {
    expect(typeof d.chooseController).toBe("function")
  })
  it("connected", async () => {
    expect(typeof d.connected).toBe("function")
  })
  it("close", async () => {
    expect(typeof d.close).toBe("function")
  })
})

describe("Can connect to all registered controllers.  #driver_unit #db", () => {
  it(
    "Tiny Connection",
    async () => {
      const d = new DatabaseDriver()
      await d.chooseController("tiny")
      expect(await d.connected()).toBe(true)
    },
    timeOut
  )
  it(
    "Mongo Connection",
    async () => {
      const d = new DatabaseDriver()
      await d.chooseController("mongo")
      expect(await d.connected()).toBe(true)
    },
    timeOut
  )
  it("Maria Connection Stub", async () => {
    expect(true).toBeTruthy()
  })
})

describe("Can connect to all registered controllers with applied parameter.  #driver_unit #db", () => {
  it(
    "Tiny Connection Parameter",
    async () => {
      const d = new DatabaseDriver("tiny")
      expect(await d.connected()).toBe(true)
    },
    timeOut
  )
  it(
    "Mongo Connection Parameter",
    async () => {
      const d = new DatabaseDriver("mongo")
      expect(await d.connected()).toBe(true)
    },
    timeOut
  )
  it("Maria Connection Parameter Stub", async () => {
    expect(true).toBeTruthy()
  })
})

// TODO should we test that each CRUD and query action functions, or is that test downstream good enough
