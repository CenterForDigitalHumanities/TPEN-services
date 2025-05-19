async function validateURL(url) {
  if (!url) return { valid: false, message: "Manifest URL is required for import", status: 404 }
  if (!isNaN(url)) return { valid: false, message: "Input is a number, not a URL", status: 400 }

  const urlPattern = new RegExp(
    "^(https?://((localhost)|(([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9].)+[a-zA-Z]{2,})|(\\d{1,3}\\.){3}\\d{1,3})(:\\d+)?(/[-a-zA-Z0-9@:%_+.~#?&//=]*)?(\\?[;&a-zA-Z0-9@:%_+.~#?&//=]*)?(#[a-zA-Z0-9@:%_+.~#?&//=]*)?)$"
  )
  if (!urlPattern.test(url)) return { valid: false, message: "Invalid URL format", status: 400 }

  try {
    const response = await fetch(url)
    const contentType = response.headers.get("Content-Type")
    if (!contentType || (!contentType.includes("application/json") && !contentType.includes("application/ld+json"))) {
      return {
        valid: false,
        message: "URL does not point to valid JSON",
        status: 415
      }
    }

    const data = await response.json()
    let dataType = data["@type"] ?? data.type
    if (dataType !== "sc:Manifest" && dataType !== "Manifest") {
      return {
        valid: false,
        message: `Could not determine type of payload from ${url}`,
        resolvedPayload: data,
        status: 422
      }
    }

    return { valid: true }
  } catch {
    return { valid: false, message: "URL is not reachable", status: 500 }
  }
}

export default validateURL
