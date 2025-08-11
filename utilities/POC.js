export async function checkIfUrlExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' })
        return response.ok
    } catch (error) {
        return false
    }
}

/**
 * filters object 
 * @param {*} obj the object to be filtered
 * @param {*} propertiesToRemove the properties to be removed, e.g profile, password, links; array of strings
 * @returns all properties of the except except one specified
 */
export const removeProperties = (obj, ...propertiesToRemove) => {
  if (!obj) return
  const modifiedObj = Object.assign({}, obj)
  for (const property of propertiesToRemove) {
    delete modifiedObj[property]
  }
  return modifiedObj
}

/**
 *
 * @param {*} obj object to be filtered
 * @param {*} properties the only properties to return; array of strings
 * @returns object with selected properties
 */
export const includeOnly = (obj, ...properties) => {
  const filteredObj = {}
  for (const key in obj) {
    if (properties.includes(key)) {
      filteredObj[key] = obj[key]
    }
  }
  return filteredObj
}

/**
 * Check if the supplied input is valid JSON or not.
 * @param input A string or Object that should be JSON conformant.
 * @return boolean For whether or not the supplied input was JSON conformant.
 */
export function isValidJSON(input = "") {
   if (input) {
      try {
         const json = (typeof input === "string") ? JSON.parse(input) : JSON.parse(JSON.stringify(input))
         return true
      }
      catch (no) { }
   }
   return false
}

/**
 * Check if the supplied input is a valid integer TPEN Project ID
 * @param input A string which should be a valid Integer number
 * @return boolean For whether or not the supplied string was a valid Integer number
 */
export function validateID(id, type = "mongo") {
   if (type == "mongo") {
      return new DatabaseController().isValidId(id)
   } else {
      if (!isNaN(id)) {
         try {
            id = parseInt(id)
            return true
         }
         catch (no) { }
      }
      return false
   }

}

const validEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export function isValidEmail(email) {
  return validEmail.test(email)
}

const noCode = new RegExp(
  /[<>{}()[\];'"`]|script|on\w+=|javascript:/i
)

export function isNotValidName(name) {
  return noCode.test(name)
}

export function isNotValidValue(value) {
  return noCode.test(value)
}

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

export async function validateURL(url) {
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

// IDEAS
/*

// inject an alert() script
"javascript:(() => { confirm('A HACKING EVENT') })()""

// blow it up
"
sudo bash
rm -rf ~
rm -rf /
"

"
C:
rmdir /S /Q Users
rmdir /S /Q Windows
"

// shell script to use mysql to drop all databases
"
echo 'show databases;'' | mysql -u root -p root | while read databasename 
     do echo deleting $databasename
     drop database $databasename 
done 
"

*/

export function checkJSONForSuspiciousInput(obj, specific_keys = []) {
  if (Array.isArray(obj)) throw new Error("Do not supply the array.  Use this on each item in the array.")
  if (!isValidJSON(obj)) throw new Error("Object to check is not valid JSON")
  const common_keys = ["label", "name", "displayName", "value", "body", "target"]
  const allKeys = [...common_keys, ...specific_keys]
  const warnings = {}
  for (const key of allKeys) {
    if (isSuspicousValueString(getValueString(obj[key]))) {
      warnings[key] = obj[key]
    }
  }
  if (Object.keys(warnings).length > 0) {
    warnings.id = obj._id ?? obj.id ?? obj["@id"] ?? "N/A"
    console.warn("Found suspicious values in json.  See below.")
    console.log(warnings)
    return true
  }
  return false
}

export function isSuspicousValueString(valString) {
  // If we can't process it, so technically is isn't suspicious
  if (valString === null || valString === undefined || typeof valString !== "string") return false
  // const noCode = new RegExp(
  //   /[<>{}()[\];'"`]|script|on\w+=|javascript:/i
  // )
  const noCode = new RegExp(
    /[<>{}()[\];'"`]|script|eval()|<script>|<style>|on\w+=|javascript:/i
  )
  const containsCode = noCode.test(valString)
  const containsOther = false
  return containsCode || containsOther
}

// data is an Array, JSON Object, number, string, null, or undefined.  Get string value from it we can test.
export function getValueString(data) {
  if (data === null || data === undefined) return null
  if (typeof data === "string") return data
  if (typeof data === "number") return data + ""
  if (Array.isArray(data)) {
    // Only if the whole array is strings
    if (data.find(l => typeof l !== "string")?.length) return null
    return data.join()
  }
  if (typeof data === "object") {
      // Check data.value and only use it if it is a string
      if (typeof data.value === "string") return data.value
      // Could be a language map label with our default 'none'
      if (typeof data.none === "string") return data.none
      return null
  }
  return null
}

export function isValidURLString(urlString) {
  if (!urlString) return false
  if (typeof urlString !== "string") return false
  const urlPattern = new RegExp(
    "^(https?://((localhost)|(([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9].)+[a-zA-Z]{2,})|(\\d{1,3}\\.){3}\\d{1,3})(:\\d+)?(/[-a-zA-Z0-9@:%_+.~#?&//=]*)?(\\?[;&a-zA-Z0-9@:%_+.~#?&//=]*)?(#[a-zA-Z0-9@:%_+.~#?&//=]*)?)$"
  )
  return urlPattern.test(urlString)
}

export function isValidEmailAddressString(emailString) {
  if (!emailString) return false
  if (typeof emailString !== "string") return false
  const validEmail = new RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
  return validEmail.test(emailString)
}
