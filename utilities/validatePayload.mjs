export function validateProjectPayload(payload) { 
  if (!payload) return {isValid:false, errors:"Project cannot be created from an empty object"}

  // include other required parameters (layers, ...) as they become known.
  const requiredElements = [ "metadata", "layers", "title", "manifest", "@context"]
  const missingElements = requiredElements.filter(
    (element) => !payload.hasOwnProperty(element)
  )

  if (missingElements.length > 0) {
    return {
      isValid: false,
      errors: `Missing required elements: ${missingElements.join(", ")}`
    }
  }

  return {isValid: true, errors: null}
}
