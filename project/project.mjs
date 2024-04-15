import * as utils from '../utilities/shared.mjs'
import * as fs from 'fs'
import uuid from 'uuid';

export async function findTheProjectByID(id = null) {
  let project = null
  if (!utils.validateID(id)) return project
  const mockPause = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(null)
    }, 1500)
  })

  if (id && id === 7085) {
    let projectFileBuffer = fs.readFileSync('./public/project.json', (err, data) => {
      if (err) throw err
    })
    project = projectFileBuffer !== null && JSON.parse(projectFileBuffer.toString())
  }
  if (project === null) {
    project = await mockPause
  }
  return project
}


export async function saveAnnotationCollection(annotationCollection) {
  try {
    //await db.collection('annotation_collections').insertOne(annotationCollection);
  } catch (error) {
    throw new Error('Error saving annotation collection to the database');
  }
}

export async function saveAnnotationPage(annotationPage) {
  try {
   //await db.collection('annotation_pages').insertOne(annotationPage);
  } catch (error) {
    throw new Error('Error saving annotation page to the database');
  }
}


export function AnnotationCollectionFactory(label, creator, items) {
  const id = `https://store.rerum.io/v1/id/${uuid.v4()}`;
  const total = items.length;
  const first = items.length > 0 ? items[0].id : null;
  const last = items.length > 0 ? items[items.length - 1].id : null;
  const partOf = `https://static.t-pen.org/${uuid.v4()}/project.json`;
  const annotationCollection = {
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    id,
    type: 'AnnotationCollection',
    label,
    creator,
    total,
    first,
    last,
    partOf
  };
  return annotationCollection;
}

export function AnnotationPageFactory(id, target, items) {
  // Generate unique ID for the annotation page
  const pageId = `https://store.rerum.io/v1/id/${uuid.v4()}`;

  // Generate next page URL
  const nextPage = items.length > 1 ? `https://store.rerum.io/v1/id/${uuid.v4()}` : null;

  // Create the annotation page object
  const annotationPage = {
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    id: pageId,
    type: 'AnnotationPage',
    partOf: id,
    target,
    next: nextPage,
    items
  };

  return annotationPage;
}