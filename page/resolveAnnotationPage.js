const RERUM_PREFIX = process.env.RERUMIDPREFIX ?? 'https://devstore.rerum.io/v1/id/'

/**
 * Attempt to resolve an AnnotationPage's referenced resources (Annotations, bodies, Collections)
 * by fetching them from RERUM/TinyPEN when only an identifier is provided.
 *
 * @param {Object} annotationPage - A plain AnnotationPage JSON structure.
 * @returns {Promise<Object>} Fully-resolved AnnotationPage JSON.
 */
export const resolveAnnotationPage = async annotationPage => {
  if (!annotationPage || typeof annotationPage !== 'object') {
    throw new Error('AnnotationPage payload is required to resolve references.')
  }

  const resolvedPage = structuredClone(annotationPage)
  resolvedPage.items = await resolveAnnotations(resolvedPage.items ?? [])
  resolvedPage.partOf = await resolveCollections(resolvedPage.partOf ?? [])
  return resolvedPage
}

const resolveAnnotations = async items => Promise.all(items.map(async item => {
  const resolved = await resolveReference(item, { resolveBodies: true })
  if (!resolved?.body) return resolved
  if (Array.isArray(resolved.body)) {
    resolved.body = await Promise.all(resolved.body.map(resolveBodyNode))
  } else {
    resolved.body = await resolveBodyNode(resolved.body)
  }
  return resolved
}))

const resolveCollections = async collections => Promise.all(collections.map(col => resolveReference(col)))

const resolveBodyNode = async node => {
  if (!node) return node
  if (Array.isArray(node)) {
    return Promise.all(node.map(resolveBodyNode))
  }
  return resolveReference(node)
}

const resolveReference = async (resource, options = {}) => {
  const { resolveBodies = false } = options
  const resourceId = extractId(resource)
  if (!resourceId || !shouldResolveId(resourceId)) return resource

  const resolved = await fetchJson(resourceId)
  const merged = (resource && typeof resource === 'object' && !Array.isArray(resource))
    ? { ...resource, ...resolved }
    : resolved

  if (resolveBodies && merged.body) {
    if (Array.isArray(merged.body)) {
      merged.body = await Promise.all(merged.body.map(resolveBodyNode))
    } else {
      merged.body = await resolveBodyNode(merged.body)
    }
  }

  return merged
}

const extractId = resource => {
  if (!resource) return null
  if (typeof resource === 'string') return resource
  if (typeof resource === 'object') return resource.id ?? resource['@id'] ?? null
  return null
}

const shouldResolveId = id => typeof id === 'string' && id.startsWith(RERUM_PREFIX)

const fetchJson = async id => {
  try {
    const response = await fetch(id)
    if (!response.ok) {
      const error = new Error(`Failed to resolve resource ${id}`)
      error.status = response.status ?? 502
      throw error
    }
    return await response.json()
  } catch (err) {
    if (!err.status) err.status = 502
    throw err
  }
}

export default resolveAnnotationPage

