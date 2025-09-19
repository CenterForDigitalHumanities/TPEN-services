/**
 * Validate that the provided data payload is a valid Project object.
 *
 * FIXME this is not validating the value type of the required keys, only that the keys themselves are present.
 * I can create bad projects with malformed data via the POST /project/create endpoint.
 * Ex. this JSON will be validated even though it is severely malformed
  {
    "metadata": "metadata",
    "label": "Some Label",
    "layers": "layers",
    "manifest": {"type":"Manifest"},
    "tools": "tools",
    "group": true
  }
 *
 * @param payload - The JSON request body from the /project/create route.  
 */
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
