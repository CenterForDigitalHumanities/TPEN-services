import DatabaseDriver from "../database/driver.mjs"

const database = new DatabaseDriver("mongo")
const tinyDatabase = new DatabaseDriver("tiny")

/**
 * Finds and retrieves a project by its ID from the database.
 * @param {string} id - The ID of the project to retrieve.
 * @returns {Promise<Object>} - A promise that resolves to the project object.
 */
export async function findTheProjectByID(id = null) {
  const project = {_id : id,"@type": "Project"}
  return await database.find(project)
}

/**
 * Saves an annotation collection to the database.
 * @param {Object} annotationCollection - The annotation collection object to be saved.
 * @returns {Promise<Object>} - A promise that resolves to the saved annotation collection object.
 */
export async function saveAnnotationCollection(annotationCollection) {
  return await tinyDatabase.save(annotationCollection)
}

/**
 * Updates the layers of a project with the provided annotation collection ID.
 * @param {Object} project - The project object to update.
 * @param {string} annotationCollectionId - The ID of the annotation collection to add to the project's layers.
 * @returns {Promise<Object>} - A promise that resolves to the updated project object.
 */
export async function updateProjectLayers(project, annotationCollectionId){
  project.layers.push(annotationCollectionId)
  return await tinyDatabase.update(project)
}

/**
 * Creates an annotation collection object with the provided label, creator, and items.
 * @param {string} label - The label for the annotation collection.
 * @param {string} creator - The creator of the annotation collection.
 * @param {Array<Object>} items - An array of items for the annotation collection.
 * @returns {Object} - The created annotation collection object.
 */
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

/**
 * Generates a unique ID for annotations and annotation pages.
 * @returns {string} - A unique ID string.
 */
function generateUniqueID() {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const idLength = 16
  let id = ''
  for (let i = 0 ;i < idLength; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return `https://devstore.rerum.io/v1/id/${id}`
}

/**
 * Creates an annotation page object.
 * @param {string} id - The ID of the annotation page.
 * @param {string} target - The target of the annotation page.
 * @param {Array<Object>} items - An array of items for the annotation page.
 * @returns {Object} - The created annotation page object.
 */
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

/**
 * Creates an annotation object.
 * @param {string} body - The body of the annotation.
 * @param {string} target - The target of the annotation.
 * @returns {Object} - The created annotation object.
 * @throws {Error} - If the target URL is invalid.
 */
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

/**
 * Checks if a string is a valid URL.
 * @param {string} str - The string to check.
 * @returns {boolean} - true if the string is a valid URL, false otherwise.
 */
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
 * Saves a project to the database.
 * @param {Object} projectJSON - The project JSON object to be saved.
 * @returns {Promise<Object>} - A promise that resolves to the saved project object.
 */
export async function saveProject(projectJSON) {
  return await database.save(projectJSON)
}