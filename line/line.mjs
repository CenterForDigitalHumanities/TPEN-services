import * as utils from '../utilities/shared.mjs'

export async function findLineById(id = null, options = {}) {
  let line = null

  if (id === null || id === undefined) {
    return line
  }

  if (!utils.validateID(id)) {
    return line
  }

  const lineFromDB = mockGetByID(id)

  if (lineFromDB !== null) {
    if (options.text === 'blob') {
      return { text: lineFromDB.textualBody }
    } else if (options.image === 'full') {
      return { image: lineFromDB.canvas }
    } else if (options.image === 'line') {
      return { image: `some line image URL for id ${id}` }
    } else if (options.lookup) {
      return { relatedDocument: `some ${options.lookup} document for id ${id}` }
    } else {
      const jsonResponse = {
        '@context': lineFromDB['@context'],
        id: lineFromDB.id,
        '@type': lineFromDB['@type'],
        creator: lineFromDB.creator,
        textualBody: lineFromDB.textualBody,
        project: lineFromDB.project,
        canvas: lineFromDB.canvas,
        layer: lineFromDB.layer,
        viewer: lineFromDB.viewer,
        license: lineFromDB.license
      }

      if (options.view === 'xml') {
        return generateXML(lineFromDB)
      } else if (options.view === 'html') {
        return generateHTML(lineFromDB)
      }
      if (options.embed === true) {
        return { expandedDocument: jsonResponse }
      }

      return jsonResponse
    }
  }

  return line
}
function mockGetByID(id) {

  if (id !== 123) {
    return null
  }
  return {
    id: `#${id}`,
    '@context': 'http://t-pen.org/3/context.json',
    '@type': 'Annotation',
    creator: 'https://store.rerum.io/v1/id/hash',
    textualBody: `content of annotation ${id}`,
    project: '#ProjectId',
    canvas: 'https://example.com/canvas.json',
    layer: '#AnnotationCollectionId',
    viewer: `https://static.t-pen.org/#ProjectId/#PageId/#LineId${id}`,
    license: 'CC-BY'
  }
}

function generateXML(lineData) {
  // Generate XML representation of the line data
  return `<line><id>${lineData.id}</id><text>${lineData.textualBody}</text></line>`;
}

function generateHTML(lineData) {
  // Generate HTML viewer document
  return `
    <html>
      <head><title>Line Viewer</title></head>
      <body>
        <h1>Line ${lineData.id} Viewer</h1>
        <p>${lineData.textualBody}</p>
      </body>
    </html>
  `;
}