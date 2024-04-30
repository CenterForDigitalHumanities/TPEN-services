import DatabaseDriver from "../database/driver.mjs"

const database = new DatabaseDriver("mongo")
const tinyDatabase = new DatabaseDriver("tiny")

export async function findTheProjectByID(id = null) {
  const project = {_id : id,"@type": "Project"}
  return await database.find(project)
}


export async function saveAnnotationCollection(annotationCollection) {
  return await tinyDatabase.save(annotationCollection)
}

export async function updateProjectLayers(project, annotationCollectionId){
  project.layers.push(annotationCollectionId)
  return await tinyDatabase.update(project)
}

export async function AnnotationCollectionFactory(label, creator, items) {
  const id = generateUniqueID()
  const context = "http://www.w3.org/ns/anno.jsonld"
  const type = "AnnotationCollection"
  const total = items.length
  const annotationPages = items.map(item => AnnotationPageFactory(id, item.target, item.items))
  const annotationCollection = {
    "@context": context,
    "id": id,
    "type": type,
    "label": label,
    "creator": creator,
    "total": total,
    "items": annotationPages
  }
  return annotationCollection
}

function generateUniqueID() {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const idLength = 16
  let id = ''
  for (let i = 0 ;i < idLength; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return `https://devstore.rerum.io/v1/id/${id}`
}

function AnnotationPageFactory(id, target, items) {
  const pageId = generateUniqueID()
  const nextPage = items.length > 1 ? generateUniqueID() : null
  const annotations = items.map(item => AnnotationFactory(item.body, item.target))
  const annotationPage = {
      '@context': 'http://www.w3.org/ns/anno.jsonld',
      id: pageId,
      type: 'AnnotationPage',
      partOf: id,
      target: target,
      next: nextPage,
      items: annotations
  }
  return annotationPage
}

function AnnotationFactory(body, target) {
  const id = generateUniqueID()
  const context = "http://www.w3.org/ns/anno.jsonld"
  const type = "Annotation"
  if (!isValidURL(target)) {
      throw new Error("Invalid target URL")
  }
  const annotation = {
      "@context": context,
      "@id": id,
      "type": type,
      "body": body,
      "target": target
  }
  return annotation
}

function isValidURL(str) {
  const pattern = new RegExp('^(https?:\\/\\/)?' +
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
      '((\\d{1,3}\\.){3}\\d{1,3}))' +
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + 
      '(\\?[;&a-z\\d%_.~+=-]*)?' +
      '(\\#[-a-z\\d_]*)?$', 'i')
  return !!pattern.test(str)
}

/** 
 * Save project to Mongo database
 */
export async function saveProject(projectJSON) {
  return await database.save(projectJSON)
}