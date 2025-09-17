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
