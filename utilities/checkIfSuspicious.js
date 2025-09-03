/**
  * When clients make request they can provide anything in the body.  Some things, like labels,
  * we take into database and expect it to render on HTML pages when it is returned to clients.
  *
  * JSON and Strings should not be code of any kind, whether they are db requests, script injection, or OS commands.
  * This library contains middleware to use on routes as well as individual functions to use
  * outside of the middleware chain for custom suspicious value handling.
  */

import { isValidJSON, respondWithError } from "./shared.js"

/**
 * This middleware function checks request bodies for suspcious looking JSON or strings.
 * Use it to protect individual routes
  1. import isSuspiciousRequest into the route file
  2. apply to route like route.patch("/label", isSuspiciousRequest(), controller) 
 * 
 * @returns next() to move down the middleware chain or 422
 */
function isSuspiciousRequest() {

  function isSuspiciousBody(req, res, next) {
    const body = req?.body
    if (!body) return next()
    if (isValidJSON(body)) {
      if (isSuspiciousJSON(body)) return respondWithError(res, 422, "Suspicious input will not be processed.")
    }
    else if (typeof body === "string" || typeof body === "number") {
      if (isSuspiciousValueString(body+"")) return respondWithError(res, 422, "Suspicious input will not be processed.")
    } 
    next()
  }

  return isSuspiciousBody
}

export default isSuspiciousRequest

/**
 * Go through relevant keys on a TPEN3 JSON object that may have a value
 * set by direct user input.
 */ 
export function isSuspiciousJSON(obj, specific_keys = [], logWarning = true) {
  if (Array.isArray(obj)) throw new Error("Do not supply the array.  Use this on each item in the array.")
  if (!isValidJSON(obj)) throw new Error("Object to check is not valid JSON")
  // Helps gaurd bad logWarning param, to make sure the warning log happens as often as possible.
  if (typeof logWarning !== "boolean") logWarning = true
  const common_keys = ["label", "name", "displayName", "value", "body", "target", "text"]
  const allKeys = [...common_keys, ...specific_keys]
  const warnings = {}
  for (const key of allKeys) {
    // Also check embedded JSON values recursively, without logging.
    if (isValidJSON(obj[key]) && isSuspiciousJSON(obj[key], [], false)) {
      warnings[key] = getValueString(obj[key])
      continue
    }  
    if (isSuspiciousValueString(getValueString(obj[key]))) {
      warnings[key] = obj[key]
    }
  }
  if (Object.keys(warnings).length > 0) {
    if (logWarning) {
      console.warn("Found suspicious values in json.  See below.")
      console.warn(warnings)  
    }
    return true
  }
  return false
}

/**
 * For some string do some reasonable checks to see if it may contain something that seems like code.
 */ 
export function isSuspiciousValueString(valString) {
  // We can't process it, so technically is isn't suspicious
  if (valString === null || valString === undefined || typeof valString !== "string") return false
  return containsScript(valString)
}

/**
 * For some string do some reasonable checks to see if it may contain something that seems like a script.
 * Mostly concerned with script injection.  PHP, Javascript, Perl, JQuery, JSP, etc.
 */ 
export function containsScript(str) {
  // We can't process it, so technically is isn't suspicious
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
  * Get the string value string from some data passed in, if possible.
  * return null if no string can be processed from the data 
  *
  * @param data - an Array, JSON Object, number, string, null, or undefined
  */
function getValueString(data) {
  if (data === null || data === undefined) return null
  if (typeof data === "string") return data
  if (typeof data === "number") return data + ""
  if (Array.isArray(data)) {
    // Only if the whole array is strings or numbers
    if (data.find(l => typeof l !== "string" || typeof l !== "number")?.length) return null
    return data.join()
  }
  if (typeof data === "object") {
      // Check data.value and only use it if it is a string or number
      if (typeof data.value === "string" || typeof data.value === "number") return data.value + ""
      // Could be a language map label with our default 'none'
      if (typeof data.none === "string") return data.none
      return null
  }
  return null
}
