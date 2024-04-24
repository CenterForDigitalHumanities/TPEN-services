// page.mjs

import DatabaseDriver from "../database/driver.mjs"
const database = new DatabaseDriver("tiny")

export async function findPageById(id = null) {
  if (id) {
    return await database.find({ _id: id, "type": "AnnotationPage" })
  }
}

export async function updateAnnotationPage(annotationPage) {
  return await database.update(annotationPage)
}

/**
 * Appends a line to an annotation page. Line is added to the end of any existing lines.
 * @param {object} annotationPage - The annotation page to append the line to.
 * @param {object} annotation - The annotation to append.
 * @returns {Promise<object>} - A promise resolving to the updated annotation collection.
 */
export async function appendAnnotationToPage(annotation, annotationPage) {
  const {
    '@context': context,
    '@id': id,
    type,
    target,
    next,
    partOf,
    items,
    creator
  } = annotationPage[0]
  items.push(annotation)
  const updatedAnnotationPage = {
    "@context": context,
    "@id": id,
    "type": type,
    "target": target,
    "next": next,
    "items": items,
    "partOf": partOf,
    "creator": creator
  }

  return updatedAnnotationPage
}

/**
 * Prepends a line to an annotation page.
 * @param {object} annotationPage - The annotation page to prepend the line to.
 * @param {object} annotations - The annotation to prepend.
 * @returns {Promise<object>} - A promise resolving to the updated annotation collection.
 */
export async function prependAnnotationToPage(annotations, annotationPage) {
  const {
    '@context': context,
    '@id': id,
    type,
    target,
    next,
    partOf,
    items,
    creator
  } = annotationPage[0]
  const newItems = [annotations, ...items]
  const updatedAnnotationPage = {
    "@context": context,
    "@id": id,
    "type": type,
    "target": target,
    "next": next,
    "items": newItems,
    "partOf": partOf,
    "creator": creator
  }
  return updatedAnnotationPage
}
export async function findAnnotationCollectionByPageId(pageId) {
  const page = await findPageById(pageId)
  if (page && page[0] && page[0].partOf) {
    const collectionId = page[0].partOf
    return await database.find({_id: collectionId, "type": "AnnotationCollection"})
  }
}

/**
 * Updates the Annotation Collection.
 * @param {object} annotationPage - The updated annotation page.
 * @returns {Promise<void>} - A promise resolving after updating the Annotation Collection.
 */
export async function updateAnnotationCollection(annotationCollection) {
  return await database.update(annotationCollection)
}

/**
 * Updates the Project.
 * @param {object} annotationPage - The updated annotation page.
 * @returns {Promise<void>} - A promise resolving after updating the Project.
 */

export async function updateProject(project) {
  return await database.update(project)
}