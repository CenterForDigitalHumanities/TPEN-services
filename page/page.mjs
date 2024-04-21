import * as utils from "../utilities/shared.mjs"
import DatabaseDriver from "../database/driver.mjs"
const database = new DatabaseDriver("tiny")

export async function findPageById(id = null) {
    let page = null
  
    if (!utils.validateID(id)) {
      return page
    }
  
    const mockPause = new Promise((resolve) => {
      setTimeout(() => {
        resolve(null)
      }, 1500)
    })
  
    const pageArray = [
      { id: 123, text: "welcome to the page" }
    ]
  
    page = pageArray.find((page) => page.id === id) || null
  
    if (page === null) {
        page = await mockPause
    }
  
    return page
  }
  /**
 * Appends a line to an annotation page.Line is added to the end of any existing lines
 * @param {object} annotationPage - The annotation page to append the line to.
 * @returns {Promise<object>} - A promise resolving to the updated annotation collection.
 */
  export async function appendLine(annotationPage) {
    const annotationCollection = {
      "@context": "http://www.w3.org/ns/anno.jsonld",
      "id": "http://example.org/collection1",
      "type": "AnnotationCollection",
      "label": "Two Annotations",
      "total": 2,
      "first": {
        "id": "http://example.org/page1",
        "type": "AnnotationPage",
        "startIndex": 0,
        "items": [
          {
            "id": "http://example.org/anno1",
            "type": "Annotation",
            "body": "http://example.net/comment1",
            "target": "http://example.com/book/chapter1"
          }
        ]
      }
    }
  
    if (!annotationCollection.items) {
      annotationCollection.items = []
    }

    annotationCollection.first.items.push(annotationPage)
  
    return annotationCollection
  }
  /**
 * Prepends a line to an annotation page.
 * @param {object} annotationPage - The annotation page to prepend the line to.
 * @returns {Promise<object>} - A promise resolving to the updated annotation collection.
 */
  export async function prependLine(annotationPage) {
    const annotationCollection = {
      "@context": "http://www.w3.org/ns/anno.jsonld",
      "id": "http://example.org/collection1",
      "type": "AnnotationCollection",
      "label": "Two Annotations",
      "total": 2,
      "first": {
        "id": "http://example.org/page1",
        "type": "AnnotationPage",
        "startIndex": 0,
        "items": [
          {
            "id": "http://example.org/anno1",
            "type": "Annotation",
            "body": "http://example.net/comment1",
            "target": "http://example.com/book/chapter1"
          }
        ]
      }
    }
  
    if (!annotationCollection.items) {
      annotationCollection.items = []
    }

    annotationCollection.first.items.splice(0, 0, annotationPage)
  
    return annotationCollection
  }