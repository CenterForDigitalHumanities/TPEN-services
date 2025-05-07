import * as utils from '../utilities/shared.js'

export async function findLineById(id = null, options = {}) {
  if (id === null || id === undefined || !utils.validateID(id)) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: null }
  }

  const mockPause = new Promise((resolve) => {
    setTimeout(() => {
      resolve(null)
    }, 1500)
  })

  const linesArray = [
    {
      id: 123,
      text: 'Hey TPEN Works on 123',
      '@context': 'http://t-pen.org/3/context.json',
      '@type': 'Annotation',
      creator: 'https://store.rerum.io/v1/id/hash',
      project: '#ProjectId',
      canvas: 'https://example.com/canvas.json',
      layer: '#AnnotationCollectionId',
      viewer: 'https://static.t-pen.org/#ProjectId/#PageId/#LineId123',
      license: 'CC-BY',
    },
  ]

  let line = linesArray.find((line) => line.id === id) || (await mockPause)

  if (line === null || line.id !== id) {
    return { statusCode: 404, body: `TPEN 3 line "${id}" does not exist.` }
  }

  if (options.text === 'blob') {
  return { statusCode: 200, headers: { 'Content-Type': 'text/plain' }, body: line.text }
}


  switch (options.image) {
    case 'full':
      return { statusCode: 200, headers: { 'Content-Type': 'image/jpeg' }, body: line.canvas }
    case 'line':
      return { statusCode: 200, headers: { 'Content-Type': 'image/jpeg' }, body: `some line image URL for id ${id}` }
    default:
      break
  }

  if (options.lookup) {
    return { statusCode: 200, headers: { 'Content-Type': 'text/plain' }, body: `some ${options.lookup} document for id ${id}` }
  }

  const jsonResponse = {
    '@context': line['@context'],
    id: line.id,
    '@type': line['@type'],
    creator: line.creator,
    textualBody: line.text,
    project: line.project,
    canvas: line.canvas,
    layer: line.layer,
    viewer: line.viewer,
    license: line.license,
  }
  switch (options.view) {
    case 'xml':
      return { statusCode: 200, headers: { 'Content-Type': 'text/xml' }, body: generateXML(line) }
    case 'html':
      return { statusCode: 200, headers: { 'Content-Type': 'text/html' }, body: generateHTML(line) }
    default:
      break
  }

  if (options.embed === true) {
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expandedDocument: jsonResponse }) }
  }

  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: jsonResponse }
}

function generateXML(lineData) {
  // Generate XML representation of the line data
  return `<line><id>${lineData.id}</id><text>${lineData.text}</text></line>`
}

function generateHTML(lineData) {
  // Generate HTML viewer document
  return `
    <html>
      <head><title>Line Viewer</title></head>
      <body>
        <h1>Line ${lineData.id} Viewer</h1>
        <p>${lineData.text}</p>
      </body>
    </html>
  `
}
