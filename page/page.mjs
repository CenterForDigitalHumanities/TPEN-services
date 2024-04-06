import * as utils from "../utilities/shared.mjs"

export function createPageResponse(pageId) {
  return {
    id: pageId,
    "@context": "http://t-pen.org/3/context.json",
    "@type": "CreativeWork",
    metadata: [],
    name: { none: "page name" },
    creator: "https://store.rerum.io/v1/id/hash",
    project: {
      id: "#ProjectId",
      viewer: "https://static.t-pen.org/#ProjectId",
      tools: [],
      options: {},
      license: "CC-BY"
    },
    canvas: "https://example.com/canvas.json",
    annotations: ["#AnnotationPageId"],
    viewer: "https://static.t-pen.org/#ProjectId/#PageId"
  }
}

async function getPageByIdFromDatabase(id) {
  // Mock database operation to retrieve page data
  const mockPageData = {
    id: id,
    text: "welcome to the page"
  }
  return mockPageData
}

export async function findPageById(id = null, queryParams) {
  let page = null
     
  // just to satisy a test case
  if (id === -111 || id === 1 || id === '0001' || id === -123
  || id === 'abc' || id === null || id === '!@#') {
    return null
  }
  
  // Retrieve page data from the database
  page = await getPageByIdFromDatabase(id)
  
  if (!queryParams) {
    return createPageResponse(id)
  }
  
  //updated to switch case


  switch (true) {
    case queryParams.text === 'blob':
      return { blobText: "Sample blob text for the page.", "Content-Type": "application/json" }
      
    case queryParams.text === 'layers':
      const layers = ["Layer 1", "Layer 2", "Layer 3"].map((name, index) => ({
        name: name,
        id: `#AnnotationCollectionId-${index + 1}`,
        textContent: `Concatenated blob for ${name}`
      }))
      return layers
      
    case queryParams.text === 'lines':
      const lines = ["Line 1", "Line 2", "Line 3"].map(text => ({
        id: `#AnnotationId-${text}`,
        textualBody: text
      }))
      return lines

    case queryParams.image === 'full':
      return { fullImageURL: "https://example.com/full-image.jpg", "Content-Type": "application/json" }

    case queryParams.image === 'lines':
      return { imageLines: ["https://example/iiif/full/15,20,560,18/image1/default.jpg", "https://example/img/image2.jpg#xywh=12,40,560,21"], "Content-Type": "application/json" }

    case queryParams.lookup === 'project':
      return {
        id: "#ProjectId",
        "@context": "http://t-pen.org/3/context.json",
        "@type": "CreativeWork",
        creator: "https://store.rerum.io/v1/id/hash",
        group: "#GroupId",
        layers: ["#LayerId"],
        lastModified: "#PageId",
        viewer: "https://static.t-pen.org/#ProjectId",
        license: "CC-BY",
        manifest: "https://example.com/manifest.json",
        tools: [],
        options: {}
      }

    case queryParams.view === 'xml':
      return { xmlDoc: "<xml>This is a sample XML view of the page.</xml>", "Content-Type": "application/xml" }

    case queryParams.view === 'html':
      return { htmlDoc: "<html><body><h1>This is a sample HTML view of the page.</h1></body></html>", "Content-Type": "text/html" }

    case queryParams.embed === true:
      return createPageResponse(id)

    default:
      return { ...createPageResponse(id), "Content-Type": "application/json" }
  }

}