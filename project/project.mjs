import * as utils from '../utilities/shared.mjs'
import DatabaseDriver from "../database/driver.mjs"

const database = new DatabaseDriver("tiny")
const mongoDatabase = new DatabaseDriver("mongo")

export async function findTheProjectByID(id = null) {
    return await mongoDatabase.find({_id : id,"@type": "Project"});
  }

export async function saveAnnotationCollection(annotationCollection) {
    return database.save(annotationCollection)
}

export async function updateProjectLayers(project, annotationCollectionId){
  project.layers.push(annotationCollectionId)
  return await mongoDatabase.update(project)
}

export function AnnotationCollectionFactory(label, creator, items) {
  const id = generateUniqueID()
  const context = "http://www.w3.org/ns/anno.jsonld"
  const type = "AnnotationCollection"
  const total = items.length
  //For now just considering part of as is hex
  const partOf = generatePartOf(false)
  const annotationPages = items.map(item => AnnotationPageFactory(item.id, item.target, item.items))
  const annotationCollection = {
    "@context": context,
    "id": id,
    "type": type,
    "label": label,
    "creator": creator,
    "total": total,
    "partOf": partOf,
    "items": annotationPages
  }
  return annotationCollection
}

export function generateUniqueID() {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const idLength = 16
  let id = ''
  for (let i = 0 ;i < idLength; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return `https://store.rerum.io/v1/id/${id}`
}

export function generatePartOf(isStud) {
  const projectType = isStud ? 'stud' : 'hex';
  const partOf = `https://static.t-pen.org/${projectType}/project.json`;
  return partOf;
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