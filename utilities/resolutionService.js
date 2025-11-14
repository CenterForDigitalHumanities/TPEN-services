/**
 * Resolution Service for fully resolving referenced objects in TPEN pages
 * Integrates with TinyPEN/RERUM for object resolution
 * 
 * @author AI Assistant
 */

import dbDriver from '../database/driver.js'

/**
 * Resolve an annotation item from RERUM/TinyPEN
 * @param {string} itemId - The ID of the annotation item to resolve
 * @returns {Promise<Object>} The resolved annotation item
 */
export async function resolveAnnotationItem(itemId) {
  try {
    // Use TinyPEN controller for resolution
    const tinyController = new dbDriver("tiny")
    
    // Normalize ID format
    const normalizedId = normalizeId(itemId)
    
    // Use fetch to get the item directly from RERUM/TinyPEN
    const resolvedItem = await fetch(normalizedId, {
      method: 'GET',
      headers: {
        'Accept': 'application/json; charset=utf-8'
      }
    })
    .then(resp => {
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`)
      }
      return resp.json()
    })
    .catch(err => {
      console.error(`Fetch error for ${normalizedId}:`, err)
      return null
    })
    
    // Return resolved item or fallback to original with error
    if (resolvedItem && Object.keys(resolvedItem).length > 1) {
      return resolvedItem
    } else {
      // Graceful degradation - return original with error flag
      return {
        id: itemId,
        error: 'Resolution failed - item not found or empty response',
        original: itemId
      }
    }
  } catch (error) {
    console.error(`Failed to resolve annotation item: ${itemId}`, error)
    // Graceful degradation
    return {
      id: itemId,
      error: 'Resolution failed',
      original: itemId,
      details: error.message
    }
  }
}

/**
 * Resolve an annotation collection from RERUM/TinyPEN
 * @param {string} collectionId - The ID of the annotation collection to resolve
 * @returns {Promise<Object>} The resolved annotation collection
 */
export async function resolveAnnotationCollection(collectionId) {
  try {
    // Use direct fetch to resolve the collection
    const normalizedId = normalizeId(collectionId)
    const resolvedCollection = await fetch(normalizedId, {
      method: 'GET',
      headers: {
        'Accept': 'application/json; charset=utf-8'
      }
    })
    .then(resp => {
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`)
      }
      return resp.json()
    })
    .catch(err => {
      console.error(`Fetch error for collection ${normalizedId}:`, err)
      return null
    })
    
    if (resolvedCollection && Object.keys(resolvedCollection).length > 1) {
      return resolvedCollection
    } else {
      return {
        id: collectionId,
        type: "AnnotationCollection",
        error: 'Resolution failed - collection not found',
        original: collectionId
      }
    }
  } catch (error) {
    console.error(`Failed to resolve annotation collection: ${collectionId}`, error)
    return {
      id: collectionId,
      type: "AnnotationCollection",
      error: 'Resolution failed',
      original: collectionId,
      details: error.message
    }
  }
}

/**
 * Build a fully resolved page with all references embedded
 * @param {Object} page - The original page object
 * @param {string} projectId - The project ID for context
 * @returns {Promise<Object>} The fully resolved page
 */
export async function buildResolvedPage(page, projectId) {
  const resolvedPage = {
    '@context': page['@context'] || 'http://www.w3.org/ns/anno.jsonld',
    id: page.id,
    type: page.type || 'AnnotationPage',
    label: page.label ? { none: [page.label] } : { none: [] },
    target: page.target,
    prev: page.prev ?? null,
    next: page.next ?? null,
    creator: page.creator ?? null
  }
  
  // Resolve partOf collections if they exist
  if (page.partOf) {
    try {
      // Handle both string and object formats
      const collectionId = typeof page.partOf === 'string' ? page.partOf : page.partOf.id
      resolvedPage.partOf = [await resolveAnnotationCollection(collectionId)]
    } catch (error) {
      resolvedPage.partOf = [{
        id: page.partOf.id || page.partOf,
        type: "AnnotationCollection",
        error: "Failed to resolve collection"
      }]
    }
  }
  
  // Resolve items in parallel for performance
  if (page.items && page.items.length > 0) {
    const resolvedItems = await Promise.allSettled(
      page.items.map(async (item) => {
        const itemId = item.id || item
        return await resolveAnnotationItem(itemId)
      })
    )
    
    resolvedPage.items = resolvedItems.map(result => 
      result.status === 'fulfilled' ? result.value : {
        error: 'Resolution failed',
        original: result.reason
      }
    )
  } else {
    resolvedPage.items = []
  }
  
  return resolvedPage
}

/**
 * Normalize ID format for RERUM/TinyPEN
 * @param {string} id - The ID to normalize
 * @returns {string} The normalized ID
 */
function normalizeId(id) {
  if (!id) return id
  
  // Handle RERUM ID prefix - use the actual RERUM dev store
  const RERUM_PREFIX = 'https://devstore.rerum.io/v1/id/'
  
  if (id.startsWith('http')) {
    // If it's already a full URL, check if it needs to be converted to RERUM
    if (id.includes('localhost:3001')) {
      // Convert localhost URLs to RERUM URLs
      const idPart = id.split('/').pop()
      return RERUM_PREFIX + idPart
    }
    return id
  } else if (id.startsWith(RERUM_PREFIX)) {
    return id
  } else {
    return RERUM_PREFIX + id.split('/').pop()
  }
}