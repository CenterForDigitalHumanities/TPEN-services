/**
  * When clients make request they can provide anything in the body.  Some things, like labels,
  * we take into databases and expect it to render on HTML pages when it is returned to clients.
  *
  * JSON and Strings should not be code of any kind, whether they are db requests, script injection, or OS commands.
  * This library contains middleware to use on routes as well as individual functions to use
  * outside of the middleware chain for custom suspicious value handling.
  */

import { isValidJSON, respondWithError, languageCodes } from "./shared.js"

/**
 * This middleware function scans request bodies for suspcious looking JSON or strings.
 * Use it to protect individual routes.
  1. import contentScanMiddleware into the route file
  2. apply to route like route.patch("/label", contentScanMiddleware(), controller) 
 * 
 * @returns next() to move down the middleware chain or 422
 */
function screenContentMiddleware() {

  function suspiciousBodyContent(req, res, next) {
    const body = req?.body
    if (!body) return next()
    if (Array.isArray(body)) {
      const simple = getValueString(body)
      if (simple !== null && isSuspiciousValueString(simple, true)) return respondWithError(res, 400, "Suspicious input will not be processed.")
    }
    else if (isValidJSON(body)) {
      if (isSuspiciousJSON(body)) return respondWithError(res, 400, "Suspicious input will not be processed.")
    }
    else if (typeof body === "string" || typeof body === "number") {
      if (isSuspiciousValueString(body+"", true)) return respondWithError(res, 400, "Suspicious input will not be processed.")
    } 
    next()
  }

  return suspiciousBodyContent
}

export default screenContentMiddleware

/**
 * Go through relevant keys on a JSON object that may have a key or value
 * set by direct user input.
 */ 
export function isSuspiciousJSON(obj, specific_keys = [], logWarning = true, depth = 0) {
  // Guard against unreasonably deep embedded JSON structures so we don't recurse for too long.
  if (depth > 10) return true
  // Arrays are considered valid JSON.  Simple ones are checkd upstream.  Bail out on complex arrays here.
  if (Array.isArray(obj)) return false
  // Bail out if the data provided is not JSON.  It is invalid and not worth checking.
  if (!isValidJSON(obj)) return false
  // Helps guard bad logWarning param, to make sure the warning log happens as often as possible.
  if (typeof logWarning !== "boolean") logWarning = true
  const common_keys = ["label", "name", "displayName", "email", "url", "value", "body", "target", "text", "textValue", "roles", "language", "descripiton"]
  const allKeys = [...common_keys, ...specific_keys]
  const warnings = {}
  const warn = {}
  for (const key of allKeys) {
    // Also check embedded JSON values recursively to a max depth of 10.
    if (isValidJSON(obj[key]) && isSuspiciousJSON(obj[key], [], logWarning, depth + 1)) {
      // We don't need to log out <embedded> notes, but we could like key: <embedded> to show the trail
      // if (logWarning) {
      //   warn[key] = "<embedded>"
      //   console.warn(warn)  
      // }
      warnings[key] = "<embedded>"
    }  
    else if (isSuspiciousValueString(getValueString(obj[key]))) {
      // Note this will check simple joinable Array values like ["label 1", "label 2", 1234321]
      if (logWarning) {
        warn[key] = getValueString(obj[key])
        console.warn("Found suspicious value in JSON.  This 'key: value' may be embedded below the top level JSON.")
        console.warn(warn)  
      }
      warnings[key] = getValueString(obj[key])
      // Break out once we find the first suspicious string value.
      break
    }
  }
  // Check for possible language maps that were skipped over due to their complexity.
  const language_map_keys = ["label", "value", "summary", "requiredStatement"]
  for (const language_key of language_map_keys) {
    if (isValidJSON(obj[language_key]) && isSuspiciousLanguageMap(obj[language_key], logWarning)) {
      if (logWarning) {
        // Don't need to see the whole language map value, the specific language is already logged.
        // warn[language_key] = obj[language_key]
        warn[language_key] = "<languagemap>"
        console.warn("Found suspicious value in JSON language map.  This 'key: value' may be embedded below the top level JSON.")
        console.warn(warn)  
      }
      warnings[language_key] = obj[language_key]
      break
    }
  }
  // Could collect all warnings and log them out here, but we break out on the first warning instead.
  return Object.keys(warnings).length > 0
}

/**
 * For some string do some reasonable checks to see if it may contain something that seems like code.
 */ 
export function isSuspiciousValueString(valString, logWarning = false) {
  // We can't process it, so technically it isn't suspicious
  if (valString === null || valString === undefined || typeof valString !== "string") return false
  // Helps guard bad logWarning param
  if (typeof logWarning !== "boolean") logWarning = false
  const sus = containsScript(valString)
  if (sus && logWarning) {
    console.warn("Suspicious content detected.  See string below.")
    console.warn(valString)
  }
  return sus
}

/**
 * Language maps are of a special complexity but need to be checked.
 * They are a JSON object with an indeterminate amount of valid or invalid language code keys.
 * Each key has a value that is supposed to be an Array of strings.
 * We want to know if any "valid-looking" language code key has a suspicious value.
 * Language code keys that clearly are not valid language codes should be ignored.
 */
export function isSuspiciousLanguageMap(languageMapObj, logWarning = false) {
  // We can't process it, so technically it isn't suspicious
  if (!isValidJSON(languageMapObj)) return false
  // Helps guard bad logWarning param
  if (typeof logWarning !== "boolean") logWarning = false
  let sus = false
  const warn = {}
  for (const key in languageMapObj) {
    if (isValidLanguageMapKey(key)) {
      if (isSuspiciousValueString(getValueString(languageMapObj[key]))) {
        sus = true
        warn[key] = getValueString(languageMapObj[key])
        break
      }
    }
  }
  if (sus && logWarning) {
    console.warn("Suspicious content detected.  See language map entry below.")
    console.warn(warn)
  }
  return sus
}

/**
 * A key from a valid JSON object that may be a language map.
 * Determine if the key is a valid-looking language map key.
 * Typical language codes are 2-3 characters, but extensions and subtagging make them longer.
 * Limiting the max length to a total of 1 language code with 3 extensions.
 * It must be 15 characters or less and only contain lowercase letters and '-'
 */ 
function isValidLanguageMapKey(key) {
  // Relaxed guard to make sure key has a value
  if (!key) return false
  if (key.length > 15) return false
  const chars = new RegExp(/^[a-z-]+$/)
  if (!chars.test(key)) return false
  return true
}

/**
 * For some string do some reasonable checks to see if it may contain something that seems like a script.
 * Mostly concerned with script injection.  PHP, Javascript, Perl, JQuery, JSP, etc.
 */ 
function containsScript(str) {
  // We can't process it, so technically it isn't suspicious
  if (str === null || str === undefined || typeof str !== "string") return false

  // Common webby stuff
  const commonWebPatterns = new RegExp(
    /<>|{}|\(\)|\[\]|< >|{ }|\( \)|\[ \]|==|=\[|= \[|<html|<head|<style|<body|<script|javascript:|<\?php|<%|%>|#!/
  )
  // Running in a RHEL VM, so some common RHEL stuff
  const commonOSPatterns = new RegExp(
    /sudo |service httpd|service mongod|service node|pm2 |nvm |systemctl|rm \-|mv \-|cp \-|cd \-|ls \-|ssh |sftp /
  )
  // Common scripting language words
  const ifPattern = new RegExp(/if\(|if \(/)
  const forPattern = new RegExp(/for\(|for \(|forEach\(|forEach \(/)
  const whilePattern = new RegExp(/while\(|while \(/)
  const doPattern = new RegExp(/do{|do {/)
  const fetchPattern = new RegExp(/fetch\(|fetch \(/)
  const evalPattern = new RegExp(/eval\(|eval \(/)
  const functionPattern = new RegExp(/new Function\(|new Function \(|function\(|function \(|=>{|=> {|\){|\) {|}\)|} \)/)
  const setPattern = new RegExp(/set\(|set \(/)
  const getPattern = new RegExp(/get\(|get \(/)
  const setTimeoutPattern = new RegExp(/setTimeout\(|setTimeout \(/)
  // anything .word( 
  const dotFnPattern = new RegExp(/\.\w+\(/)
  // db.anything
  const dbDotPattern = new RegExp(/db\.\w/)
  return (
    commonWebPatterns.test(str) ||
    commonOSPatterns.test(str)  ||
    dotFnPattern.test(str)      ||
    dbDotPattern.test(str)      ||
    ifPattern.test(str)         ||
    forPattern.test(str)        ||
    whilePattern.test(str)      ||
    doPattern.test(str)         ||
    fetchPattern.test(str)      ||
    evalPattern.test(str)       ||
    functionPattern.test(str)   ||
    setPattern.test(str)        ||
    getPattern.test(str)        ||
    setTimeoutPattern.test(str) 
  )
}

/**
  * Interpret a string value from the data passed in, if possible.
  * return null if the data cannot be interpreted as stringy.
  *
  * @param data - an Array, JSON Object, number, string, null, or undefined
  */
function getValueString(data) {
  if (data === null || data === undefined) return null
  if (typeof data === "string") return data
  if (typeof data === "number") return data + ""
  if (Array.isArray(data)) {
    // We can use it as a value string if the whole array is strings or numbers.
    // Otherwise it is too complex to be a value string and will be skipped. 
    if (data.filter(l => typeof l !== "string" && typeof l !== "number").length > 0) return null
    return data.join()
  }
  // Always return null for JSON data. It's not stringy.
  return null
}
