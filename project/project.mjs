import * as utils from '../utilities/shared.mjs'
import * as fs from 'fs'
import DatabaseDriver from "../database/driver.mjs"

const database = new DatabaseDriver("tiny")

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
    await database.save(annotationCollection)
  } catch (error) {
    throw new Error('Error saving annotation collection to the database')
  }
}

export async function updateProjectLayers(projectId, annotationCollectionId) {
  try {
    const project = await findTheProjectByID(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    project.layers.push(annotationCollectionId);
    await database.update(project);
  } catch (error) {
    throw new Error('Error updating project layers');
  }
}


export function AnnotationCollectionFactory(label, creator, items) {
  const id = generateUniqueID();
  const context = "http://www.w3.org/ns/anno.jsonld";
  const type = "AnnotationCollection";
  const total = items.length;
  const partOf = generatePartOf(); 
  const annotationPages = items.map(item => AnnotationPageFactory(item.id, item.target, item.items));
  const annotationCollection = {
    "@context": context,
    "id": id,
    "type": type,
    "label": label,
    "creator": creator,
    "total": total,
    "partOf": partOf,
    "items": annotationPages
  };
  return annotationCollection;
}

export function generateUniqueID() {
  // Generate a random unique ID
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const idLength = 16; // Adjust the length of the ID as needed
  let id = '';
  for (let i = 0; i < idLength; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return `https://store.rerum.io/v1/id/${id}`;
}

export function generatePartOf() {
  const partOf = 'https://static.t-pen.org/{stud || hex}/project.json'
  return partOf
}

export function AnnotationPageFactory(id, target, items) {
  const pageId = generateUniqueID()
  const nextPage = items.length > 1 ? generateUniqueID() : null
  const annotationPage = {
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    id: pageId,
    type: 'AnnotationPage',
    partOf: id,
    target: target,
    next: nextPage,
    items: items
  }
  return annotationPage
}
