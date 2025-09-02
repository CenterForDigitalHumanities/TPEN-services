import { isValidJSON } from "./shared.js"

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
  const recursiveChecks = []
  for (const key of allKeys) {
    // Also check JSON values, only one level deep.
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
      warnings.id = obj._id ?? obj.id ?? obj["@id"] ?? "N/A"
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

  const containsScriptInjection = containsScript(valString)
  const containsMongoCommands = containsMongoCommandPattern(valString)

  return containsScriptInjection || containsMongoCommands
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
    /<>|{}|\(\)|\[\]|< >|{ }|\( \)|\[ \]|==|===|=\[|= \[|<html|<head|<style|<body|<script|javascript:|new Function|<\?php|<%|%>|#!/
  )
  // Running in a RHEL VM, so some common RHEL stuff
  const commonOSPatterns = new RegExp(
    /sudo |service httpd|service mongod|service node|pm2 |nvm |systemctl|rm -|mv |cp |cd |ssh |sftp /
  )

  // Common scripting language built in reserve words and function syntax
  const ifPattern = new RegExp(/if\(|if \(/)
  const forPattern = new RegExp(/for\(|for \(|forEach\(|forEach \(/)
  const whilePattern = new RegExp(/while\(|while \(/)
  const doPattern = new RegExp(/do{|do {/)
  const fetchPattern = new RegExp(/fetch\(|fetch \(/)
  const functionPattern = new RegExp(/function\(|function \(|=>{|=> {|\){|\) {|}\)|} \)/)
  const setPattern = new RegExp(/set\(|set \(/)
  const getPattern = new RegExp(/get\(|get \(/)
  const setTimeoutPattern = new RegExp(/setTimeout\(|setTimeout \(/)
  // anything .word(
  const dotFnPattern = new RegExp(/\.\w+\(/)

  // console.log("Patterns")
  // console.log(commonWebPatterns.test(str))
  // console.log(commonOSPatterns.test(str))
  // console.log(dotFnPattern.test(str))
  // console.log(ifPattern.test(str))
  // console.log(forPattern.test(str))
  // console.log(whilePattern.test(str))
  // console.log(doPattern.test(str))
  // console.log(fetchPattern.test(str))
  // console.log(functionPattern.test(str))
  // console.log(setPattern.test(str))
  // console.log(getPattern.test(str))
  // console.log(setTimeoutPattern.test(str)) 

  // console.log("Return")
  // console.log(
  //   commonWebPatterns.test(str) ||
  //   commonOSPatterns.test(str)  ||
  //   dotFnPattern.test(str)      ||
  //   ifPattern.test(str)         ||
  //   forPattern.test(str)        ||
  //   whilePattern.test(str)      ||
  //   doPattern.test(str)         ||
  //   fetchPattern.test(str)      ||
  //   functionPattern.test(str)   ||
  //   setPattern.test(str)        ||
  //   getPattern.test(str)        ||
  //   setTimeoutPattern.test(str) 
  // )

  return (
    commonWebPatterns.test(str) ||
    commonOSPatterns.test(str)  ||
    dotFnPattern.test(str)      ||
    ifPattern.test(str)         ||
    forPattern.test(str)        ||
    whilePattern.test(str)      ||
    doPattern.test(str)         ||
    fetchPattern.test(str)      ||
    functionPattern.test(str)   ||
    setPattern.test(str)        ||
    getPattern.test(str)        ||
    setTimeoutPattern.test(str) 
  )

}

/**
 * For some string do some reasonable checks to see if it may contain something that seems like mongo commands.
 * return false if the parameter cannot be processed because it isn't a string.
 *
 * @param str - Some string
 */ 
export function containsMongoCommandPattern(str) {
  // We can't process it, so technically it does not contain mongo commands
  if (str === null || str === undefined || typeof str !== "string") return false
  // Matches patterns like db.dropDatabase() or db.collection.method(...)
  const commandPattern = /db\.\w+/
  return commandPattern.test(str)
}

/**
  * Get the string value string from some data passed in, if possible.
  * return null if no string can be processed from the data 
  *
  * @param data - an Array, JSON Object, number, string, null, or undefined
  */
export function getValueString(data) {
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
      if (typeof data.value === "string") return data.value
      if (typeof data.value === "number") return data.value + ""
      // Could be a language map label with our default 'none'
      if (typeof data.none === "string") return data.none
      return null
  }
  return null
}
