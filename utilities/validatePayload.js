export function validateProjectPayload(payload) {
  if (!payload) return { isValid: false, errors: "Project cannot be created from an empty object" }
  const requiredElements = ["metadata", "layers", "label", "manifest", "creator", "group"]
  const missingElements = requiredElements.filter(element => !payload.hasOwnProperty(element))
  if (missingElements.length > 0) {
    return {
      isValid: false,
      errors: `Missing required elements: ${missingElements.join(", ")}`
    }
  }
  return { isValid: true, errors: null }
}
