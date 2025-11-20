import Column from "../Column.js"
import dbDriver from "../../../database/driver.js"
import { expect, jest } from "@jest/globals"

jest.mock("../../../database/driver.js")

describe.skip("Column Class", () => {
    let column
    let databaseMock

    beforeEach(() => {
        databaseMock = new dbDriver("mongo")
        column = new Column()
        column.data = { _id: "mockID", label: "test label", lines: [] }
    })

    test("should load column data from database", async () => {
        databaseMock.getById = jest.fn().mockResolvedValue({
            _id: "mockID",
            label: "Loaded Label",
            lines: []
        })

        const col = new Column("mockID")
        col.data = null

        const result = await col.getColumnData()

        expect(databaseMock.getById).toHaveBeenCalledWith("mockID", process.env.TPENCOLUMNS)
        expect(result.label).toBe("Loaded Label")
    })

    test("should return existing column data when already loaded", async () => {
        const result = await column.getColumnData()
        expect(result.label).toBe("test label")
    })

    test("should save column", async () => {
        databaseMock.save = jest.fn().mockResolvedValue("savedColumn")

        const result = await column.save()

        expect(databaseMock.save).toHaveBeenCalledWith(column.data, process.env.TPENCOLUMNS)
        expect(result).toBe("savedColumn")
    })

    test("should update column", async () => {
        databaseMock.update = jest.fn().mockResolvedValue("updatedColumn")

        const result = await column.update()

        expect(databaseMock.update).toHaveBeenCalledWith(column.data, process.env.TPENCOLUMNS)
        expect(result).toBe("updatedColumn")
    })

    test("should delete a column", async () => {
        databaseMock.delete = jest.fn().mockResolvedValue("deletedColumn")

        const col = new Column("deleteMe")
        const result = await col.delete()

        expect(databaseMock.delete).toHaveBeenCalledWith("deleteMe", process.env.TPENCOLUMNS)
        expect(result).toBe("deletedColumn")
    })

    test("should create a new column", async () => {
        databaseMock.reserveId = jest.fn().mockReturnValue("newColumnId")
        databaseMock.save = jest.fn().mockResolvedValue("newColumn")

        const result = await Column.createNewColumn(
            "PAGE1",
            "PROJECT1",
            "My Column",
            ["line1"],
            true
        )

        expect(databaseMock.save).toHaveBeenCalled()

        const savedObject = databaseMock.save.mock.calls[0][0]

        expect(savedObject._id).toBe("newColumnId")
        expect(savedObject.label).toBe("My Column")
        expect(savedObject.lines).toEqual(["line1"])
        expect(savedObject.unordered).toBe(true)
        expect(savedObject.onPage).toBe("PAGE1")
        expect(savedObject.inProject).toBe("PROJECT1")

        expect(result).toBe("newColumn")
    })
})
