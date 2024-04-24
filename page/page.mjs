import DatabaseDriver from "../database/driver.mjs"
const database = new DatabaseDriver("tiny")

export async function findPageById(id = null) {
  if (id) {
    return await database.find({_id:  id,"type": "AnnotationPage"})
  }
}


export async function updateAnnotationPage(annotationPage) {
  return await database.update(annotationPage)    
}

  /**
 * Appends a line to an annotation page.Line is added to the end of any existing lines
 * @param {object} annotationPage - The annotation page to append the line to.
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
 * @returns {Promise<object>} - A promise resolving to the updated annotation collection.
 */
  export async function prependAnnotationToPage(annotations,annotationPage) {
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

