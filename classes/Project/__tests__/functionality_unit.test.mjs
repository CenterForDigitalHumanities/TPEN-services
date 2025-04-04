import {jest} from "@jest/globals"
import ProjectFactory from "../ProjectFactory.mjs"

describe("ProjectFactory.DBObjectFromManifest/buildPagesFromCanvases #importTests", () => {
  it("should process the manifest correctly with layers", async () => {
    const mockManifest = {
      "@id": "http://example.com/manifest/1",
      label: "Example Manifest",
      metadata: [{label: "Author", name: "Voo Onoja"}],
      items: [
        {
          "@id": "http://example.com/canvas/1",
          otherContent: [
            {
              on: "http://example.com/canvas/1",
              resources: [
                {
                  "@id": "http://example.com/line/1",
                  type: "Line",
                  value: "Sample Text"
                }
              ]
            }
          ]
        }
      ]
    }

    jest.spyOn(ProjectFactory, "buildPagesFromCanvases").mockResolvedValue([
      {
        "@id": "http://example.com/canvas/1",
        "@type": "Layer",
        pages: [
          {
            canvas: "http://example.com/canvas/1",
            lines: [
              {
                "@id": "http://example.com/line/1",
                type: "Line",
                value: "Sample Text"
              }
            ]
          }
        ]
      }
    ])

    const expectedProject = {
      label: "Example Manifest",
      metadata: [{label: "Author", name: "Voo Onoja"}],
      "@context": "http://t-pen.org/3/context.json",
      manifest: "http://example.com/manifest/1",
      layers: [
        {
          "@id": "http://example.com/canvas/1",
          "@type": "Layer",
          pages: [
            {
              canvas: "http://example.com/canvas/1",
              lines: [
                {
                  "@id": "http://example.com/line/1",
                  type: "Line",
                  value: "Sample Text"
                }
              ]
            }
          ]
        }
      ]
    }

    const result =  await ProjectFactory.DBObjectFromManifest(mockManifest)

    expect(ProjectFactory.buildPagesFromCanvases).toHaveBeenCalledWith(
      mockManifest.items
    )
  })
})
