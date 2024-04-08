import {findLineById} from "../line.mjs"
import {validateID} from "../../utilities/shared.mjs"
const timeOut = process.env.TEST_TIMEOUT ?? 5000

describe("Line endpoint functionality unit test", () => {
  describe("findLineById function", () => {
    it(
      "should return null if no ID provided",
      async () => {
        const line = await findLineById()
        expect(line.statusCode).toBe(400)
      },
      timeOut
    )

    it(
      "should return null for non-existing ID",
      async () => {
        const line = await findLineById(-111)
        expect(line.statusCode).toBe(404)
      },
      timeOut
    )

    it(
      "should return a valid line object for existing ID",
      async () => {
        const line = await findLineById(123)
        expect(line.statusCode).toBe(200)
        expect(line.body).toBeDefined()
        const lineObject = line.body
        expect(lineObject.id).toBe(123)
      },
      timeOut
    )

    it(
      "should return blob content for ?text=blob",
      async () => {
        const options = {text: "blob"}
        const lineBlob = await findLineById(123, options)
        expect(lineBlob.statusCode).toBe(200)
        expect(lineBlob.headers["Content-Type"]).toBe("text/plain")
        expect(lineBlob.body).toBeDefined()
      },
      timeOut
    )

    it(
      "should return full page URL for ?image=full",
      async () => {
        const options = {image: "full"}
        const lineFullImage = await findLineById(123, options)
        expect(lineFullImage.statusCode).toBe(200)
        expect(lineFullImage.headers["Content-Type"]).toBe("image/jpeg")
        expect(lineFullImage.body).toBeDefined()
      },
      timeOut
    )

    it(
      "should return line image fragment URL for ?image=line",
      async () => {
        const options = {image: "line"}
        const lineLineImage = await findLineById(123, options)
        expect(lineLineImage.statusCode).toBe(200)
        expect(lineLineImage.headers["Content-Type"]).toBe("image/jpeg")
        expect(lineLineImage.body).toBeDefined()
      },
      timeOut
    )

    it(
      "should return project document for ?lookup=project",
      async () => {
        const options = {lookup: "project"}
        const lineLookupProject = await findLineById(123, options)
        expect(lineLookupProject.statusCode).toBe(200)
        expect(lineLookupProject.headers["Content-Type"]).toBe("text/plain")
        expect(lineLookupProject.body).toBeDefined()
      },
      timeOut
    )

    it(
      "should return XML representation for ?view=xml",
      async () => {
        const options = {view: "xml"}
        const lineXML = await findLineById(123, options)
        expect(lineXML.statusCode).toBe(200)
        expect(lineXML.headers["Content-Type"]).toBe("text/xml")
        expect(lineXML.body).toBeDefined()
      },
      timeOut
    )

    it(
      "should return HTML viewer document for ?view=html",
      async () => {
        const options = {view: "html"}
        const lineHTML = await findLineById(123, options)
        expect(lineHTML.statusCode).toBe(200)
        expect(lineHTML.headers["Content-Type"]).toBe("text/html")
        expect(lineHTML.body).toBeDefined()
      },
      timeOut
    )

    it(
      "should return expanded document for ?embed=true",
      async () => {
        const options = {embed: true}
        const lineEmbedded = await findLineById(123, options)
        expect(lineEmbedded.statusCode).toBe(200)
        expect(lineEmbedded.headers["Content-Type"]).toBe("application/json")
        expect(lineEmbedded.body).toBeDefined()
      },
      timeOut
    )
  })

  it("No TPEN3 line ID provided. Line ID validation must be false.", () => {
    expect(validateID()).toBe(false)
  })

  it(
    "Detect TPEN3 line does not exist. The query for a TPEN3 line must be null.",
    async () => {
      const line = await findLineById(-111)
      expect(line.statusCode).toBe(404)
    },
    timeOut
  )

  it(
    "TPEN3 line does exist. Finding the line results in the line JSON",
    async () => {
      const line = await findLineById(123)
      expect(line.statusCode).toBe(200)
      expect(line.body).toBeDefined()
    },
    timeOut
  )
})
