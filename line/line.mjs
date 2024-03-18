import * as utils from '../utilities/shared.mjs';

export async function findLineById(id = null, options = {}) {
  let line = null;

  if (id === null || id === undefined) {
    return line;
  }

  if (!utils.validateID(id)) {
    return line;
  }

  const mockPause = new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, 1500);
  });

  const linesArray = [
    { id: 123, text: 'Hey TPEN Works on 123', '@context': 'http://t-pen.org/3/context.json', '@type': 'Annotation', creator: 'https://store.rerum.io/v1/id/hash', project: '#ProjectId', canvas: 'https://example.com/canvas.json', layer: '#AnnotationCollectionId', viewer: 'https://static.t-pen.org/#ProjectId/#PageId/#LineId123', license: 'CC-BY' }
  ];

  line = linesArray.find((line) => line.id === id) || null;

  if (line === null) {
    line = await mockPause;
  }

  if (line !== null) {
    if (options.text === 'blob') {
      return { 'Content-Type': 'text/plain', body: line.text };
    } else if (options.image === 'full') {
      // Assuming line.canvas contains the full image
      return { 'Content-Type': 'image/jpeg', body: line.canvas };
    } else if (options.image === 'line') {
      return { 'Content-Type': 'image/jpeg', body: `some line image URL for id ${id}` };
    } else if (options.lookup) {
      return { 'Content-Type': 'text/plain', body: `some ${options.lookup} document for id ${id}` };
    } else {
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
        license: line.license
      };

      if (options.view === 'xml') {
        return { 'Content-Type': 'text/xml', body: generateXML(line) };
      } else if (options.view === 'html') {
        return { 'Content-Type': 'text/html', body: generateHTML(line) };
      }
      if (options.embed === true) {
        return { 'Content-Type': 'application/json', body: JSON.stringify({ expandedDocument: jsonResponse }) };
      }

      return { 'Content-Type': 'application/json', body: JSON.stringify(jsonResponse) };
    }
  }

  return line;
}

function generateXML(lineData) {
  // Generate XML representation of the line data
  return `<line><id>${lineData.id}</id><text>${lineData.text}</text></line>`;
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
  `;
}
