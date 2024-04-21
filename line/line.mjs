import * as utils from '../utilities/shared.mjs'
import Database from "../database/driver.mjs"

const database = new Database("mongo")
const tinyDatabase = new Database("tiny")

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
    return { statusCode: 404, body: 'TPEN 3 line "${id}" does not exist.' }
  }

  if (options.text === 'blob') {
  return { statusCode: 200, headers: { 'Content-Type': 'text/plain' }, body: line.text }
}


  switch (options.image) {
    case 'full':
      return { statusCode: 200, headers: { 'Content-Type': 'image/jpeg' }, body: line.canvas }
    case 'line':
      return { statusCode: 200, headers: { 'Content-Type': 'image/jpeg' }, body: 'some line image URL for id ${id}' }
    default:
      break
  }

  if (options.lookup) {
    return { statusCode: 200, headers: { 'Content-Type': 'text/plain' }, body: 'some ${options.lookup} document for id ${id} '}
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
/**
 * Finds a sibling annotation by ID.
 * @param {string} siblingAnnotationId - The ID of the sibling annotation to find.
 * @returns {Promise<object>} - A promise resolving to an object representing the sibling annotation.
 */
export async function findingSiblingAnnotation(siblingAnnotationId) {
  return await tinyDatabase.find({_id: siblingAnnotationId,"@type": "AnnotationPage"})
}
/**
 * Inserts a line n the list after the Line identified.
 * @param {object} annotation - The annotation to insert.
 * @param {object} annotationPage - The annotation page to insert into.
 * @returns {Promise<object>} - A promise resolving to the updated annotation page.
 */
export async function insertLineinAnnotationPage(annotaion, annotationPage) {
  try {
      annotationPage.items.push(annotaion)
      return await tinyDatabase.update(annotationPage)
  } catch (error) {
      throw new Error('Error inserting line in annotation page: ' + error.message)
  }
}
/**
 * Inserts a line before a specific annotation in an annotation page.
 * @param {object} annotation - The annotation to insert.
 * @param {object} annotationPage - The annotation page to insert into.
 * @returns {Promise<object>} - A promise resolving to the updated annotation page.
 */
export async function insertLineBeforeAnnotation(annotation, annotationPage) {
  try {
    const itemsArray = annotationPage.items
    const annotationId = annotation.id.split('/').pop()
    const siblingIndex = itemsArray.findIndex(item => item.id === annotationId)
    if (siblingIndex === -1) {
      itemsArray.splice(0, 0, annotation)
    }
    itemsArray.splice(siblingIndex, 0, annotation)  
    return await tinyDatabase.update(annotationPage)
  } catch (error) {
    throw new Error('Error inserting line before annotation: ' + error.message)
  }
}
/**
 * Deletes a line from an annotation page.
 * @param {object} annotation - The annotation containing the line to delete.
 * @param {object} annotationPage - The annotation page containing the line to delete.
 * @returns {Promise<void>} - A promise indicating the completion of the deletion.
 */

export async function deleteLineFromAnnotation(annotation, annotationPage) {
  try {
    const itemsArray = annotationPage.items
    const annotationId = annotation.id.split('/').pop()
    const indexToDelete = itemsArray.findIndex(item => item.id === annotationId)
    if (indexToDelete === -1) {
      throw new Error('Line not found in annotation')
    }
    itemsArray.splice(indexToDelete, 1)
    await tinyDatabase.update(annotationPage)
  } catch (error) {
    throw new Error('Error deleting line from annotation: ' + error.message)
  }
}
/**
 * Updates a line in an annotation.
 * @param {object} updatedLine - The updated line.
 * @param {object} annotation - The annotation containing the line to update.
 * @returns {Promise<void>} - A promise indicating the completion of the update.
 */
export async function updateLineInAnnotation(updatedLine, annotation) {
  try {
    const itemsArray = annotation.items
    const lineId = updatedLine.id
    const indexToUpdate = itemsArray.findIndex(item => item.id === lineId)
    if (indexToUpdate === -1) {
      throw new Error('Line with ID ${lineId} not found in annotation.')
    }
    itemsArray[indexToUpdate] = updatedLine
    await tinyDatabase.update(annotation)
  } catch (error) {
    throw new Error('Error updating line in annotation: ' + error.message)
  }
}