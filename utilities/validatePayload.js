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
  const validationErrors = []

  // Validate label - must be a non-empty string
  if (typeof payload.label !== 'string' || payload.label.trim() === '') {
    validationErrors.push('label must be a non-empty string')
  }

  // Validate metadata - must be an array
  if (!Array.isArray(payload.metadata)) {
    validationErrors.push('metadata must be an array')
  }

  // Validate layers - must be an array
  if (!Array.isArray(payload.layers)) {
    validationErrors.push('layers must be an array')
  } else {
    // Validate each layer object has required properties
    for (let i = 0; i < payload.layers.length; i++) {
      const layer = payload.layers[i]
      if (typeof layer !== 'object' || layer === null) {
        validationErrors.push(`layer at index ${i} must be an object`)
        continue
      }
      
      const layerRequiredProps = ['id', 'label', 'pages']
      const missingLayerProps = layerRequiredProps.filter(prop => !layer.hasOwnProperty(prop))
      if (missingLayerProps.length > 0) {
        validationErrors.push(`layer must have id, label, and pages properties`)
        break // Only report this error once
      }
    }
  }

  // Validate manifest - must be a non-empty array
  if (!Array.isArray(payload.manifest)) {
    validationErrors.push('manifest must be an array')
  } else if (payload.manifest.length === 0) {
    validationErrors.push('manifest array cannot be empty')
  } else {
    // Validate that manifest array contains valid URIs
    const invalidUris = payload.manifest.filter(uri => {
      if (typeof uri !== 'string') return true
      try {
        new URL(uri)
        return false
      } catch {
        return true
      }
    })
    if (invalidUris.length > 0) {
      validationErrors.push('manifest array must contain valid URIs')
    }
  }

  // Validate creator - must be a non-empty string
  if (typeof payload.creator !== 'string' || payload.creator.trim() === '') {
    validationErrors.push('creator must be a non-empty string')
  }

  // Validate group - must be a non-empty string
  if (typeof payload.group !== 'string' || payload.group.trim() === '') {
    validationErrors.push('group must be a non-empty string')
  }

  if (validationErrors.length > 0) {
    return {
      isValid: false,
      errors: validationErrors.join('; ')
    }
  }

  return {isValid: true, errors: null}
}
