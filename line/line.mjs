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
    { id: 123, text: "Hey TPEN Works on 123" },
  ];

  line = linesArray.find((line) => line.id === id) || null;

  if (line === null) {
    line = await mockPause;
  }

  if (line !== null) {
    if (options.text === 'blob') {
      return { text: line.textualBody };
    } else if (options.image === 'full') {
      return { image: line.canvas };
    } else if (options.image === 'line') {
      return { image: `some line image URL for id ${id}` };
    } else if (options.lookup) {
      return { relatedDocument: `some ${options.lookup} document for id ${id}` };
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
        return generateXML(line);
      } else if (options.view === 'html') {
        return generateHTML(line);
      }
      if (options.embed === true) {
        return { expandedDocument: jsonResponse };
      }

      return jsonResponse;
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