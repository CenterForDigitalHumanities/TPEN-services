/**
 * Validate that the provided data payload is a valid Project object.
 * This function validates both the presence and the data types of required project properties.
 * 
 * @param payload - The JSON request body from the /project/create route.  
 * @returns {Object} - { isValid: boolean, errors: string|null }
 */
export function validateProjectPayload(payload) { 
  if (!payload) return {isValid: false, errors: "Project cannot be created from an empty object"}

  const requiredElements = ["metadata", "layers", "label", "manifest", "creator", "group"]
  const missingElements = requiredElements.filter(
    (element) => !payload.hasOwnProperty(element)
  )

  if (missingElements.length > 0) {
    return {
      isValid: false,
      errors: `Missing required elements: ${missingElements.join(", ")}`
    }
  }

  // Validate data types and structure of each required element
  // Return immediately upon encountering the first validation error

  // Validate label - must be a non-empty string
  if (typeof payload.label !== 'string' || payload.label.trim() === '') {
    return { isValid: false, errors: 'label must be a non-empty string' }
  }

  // Validate metadata - must be an array
  if (!Array.isArray(payload.metadata)) {
    return { isValid: false, errors: 'metadata must be an array' }
  }

  // Validate each metadata object structure
  for (let i = 0; i < payload.metadata.length; i++) {
    const metadataItem = payload.metadata[i]
    
    // Each metadata item must be an object
    if (typeof metadataItem !== 'object' || metadataItem === null) {
      return { isValid: false, errors: `metadata item at index ${i} must be an object` }
    }

    // Check for required properties: label and value
    const metadataRequiredProps = ['label', 'value']
    const missingMetadataProps = metadataRequiredProps.filter(prop => !metadataItem.hasOwnProperty(prop))
    if (missingMetadataProps.length > 0) {
      return { isValid: false, errors: 'metadata item must have label and value properties' }
    }

    // Validate label and value are non-empty strings
    if (typeof metadataItem.label !== 'string' || metadataItem.label.trim() === '') {
      return { isValid: false, errors: 'metadata item label must be a non-empty string' }
    }
    
    if (typeof metadataItem.value !== 'string' || metadataItem.value.trim() === '') {
      return { isValid: false, errors: 'metadata item value must be a non-empty string' }
    }

    // Ensure no extra properties beyond label and value
    const allowedProps = ['label', 'value']
    const extraProps = Object.keys(metadataItem).filter(prop => !allowedProps.includes(prop))
    if (extraProps.length > 0) {
      return { isValid: false, errors: 'metadata item must only have label and value properties' }
    }
  }

  // Validate layers - must be an array
  if (!Array.isArray(payload.layers)) {
    return { isValid: false, errors: 'layers must be an array' }
  }
  
  // Validate each layer object has required properties
  for (let i = 0; i < payload.layers.length; i++) {
    const layer = payload.layers[i]
    if (typeof layer !== 'object' || layer === null) {
      return { isValid: false, errors: `layer at index ${i} must be an object` }
    }
    
    const layerRequiredProps = ['id', 'label', 'pages']
    const missingLayerProps = layerRequiredProps.filter(prop => !layer.hasOwnProperty(prop))
    if (missingLayerProps.length > 0) {
      return { isValid: false, errors: 'layer must have id, label, and pages properties' }
    }

    // Validate that pages is an array
    if (!Array.isArray(layer.pages)) {
      return { isValid: false, errors: 'layer pages must be an array' }
    }

    // Validate each page object within the layer
    for (let j = 0; j < layer.pages.length; j++) {
      const page = layer.pages[j]
      if (typeof page !== 'object' || page === null) {
        return { isValid: false, errors: `page at index ${j} in layer ${i} must be an object` }
      }

      // Required properties for a page: id and target
      const pageRequiredProps = ['id', 'target']
      const missingPageProps = pageRequiredProps.filter(prop => !page.hasOwnProperty(prop))
      if (missingPageProps.length > 0) {
        return { isValid: false, errors: 'page must have id and target properties' }
      }

      // Validate page id is a non-empty string
      if (typeof page.id !== 'string' || page.id.trim() === '') {
        return { isValid: false, errors: 'page id must be a non-empty string' }
      }

      // Validate page target is a non-empty string (should be a canvas URI)
      if (typeof page.target !== 'string' || page.target.trim() === '') {
        return { isValid: false, errors: 'page target must be a non-empty string' }
      }

      // Validate optional page label if present
      if (page.hasOwnProperty('label') && (typeof page.label !== 'string' || page.label.trim() === '')) {
        return { isValid: false, errors: 'page label must be a non-empty string when present' }
      }

      // Validate optional page items if present
      if (page.hasOwnProperty('items') && !Array.isArray(page.items)) {
        return { isValid: false, errors: 'page items must be an array when present' }
      }
    }
  }

  // Validate manifest - must be a non-empty array
  if (!Array.isArray(payload.manifest)) {
    return { isValid: false, errors: 'manifest must be an array' }
  }
  
  if (payload.manifest.length === 0) {
    return { isValid: false, errors: 'manifest array cannot be empty' }
  }
  
  // Validate that manifest array contains valid URIs
  for (const uri of payload.manifest) {
    if (typeof uri !== 'string') {
      return { isValid: false, errors: 'manifest array must contain valid URIs' }
    }
    try {
      new URL(uri)
    } catch {
      return { isValid: false, errors: 'manifest array must contain valid URIs' }
    }
  }

  // Validate creator - must be a non-empty string
  if (typeof payload.creator !== 'string' || payload.creator.trim() === '') {
    return { isValid: false, errors: 'creator must be a non-empty string' }
  }

  // Validate group - must be a non-empty string
  if (typeof payload.group !== 'string' || payload.group.trim() === '') {
    return { isValid: false, errors: 'group must be a non-empty string' }
  }

  return {isValid: true, errors: null}
}
