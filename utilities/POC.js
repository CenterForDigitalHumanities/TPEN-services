
/*
 BAD ACTOR IDEAS

// inject an alert() script
"javascript:(() => { confirm('A HACKING EVENT') })()""

// blow it up
{"label":"sudo bash \nrm -rf ~ \nrm -rf /"}

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

// shell script to use mongo to drop all databases
"
echo 'show databases;'' | mysql -u root -p root | while read databasename 
     do echo deleting $databasename
     drop database $databasename 
done 
"

*/

/**
 * Go through relevant keys on a TPEN3 JSON object that may have a value
 * set by direct user input.
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

/**
 * For some string do some reasonable checks to see if it may contain something that seems like code.
 */ 
export function isSuspicousValueString(valString) {
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
    /[<>{}()[\]]|<html|<head|<style|<body|<script|new Function|<\?php|<%|%>|#!|on\w+=|javascript:/i
  )
  // Running in a RHEL VM, so some common RHEL stuff
  const commonOSPatterns = new RegExp(
    /sudo |service httpd|service mongod|service node|pm2 |nvm |systemctl|rm -|mv |cp |cd |ls |ssh |sftp |/
  )

  // Common scripting language built in reserve words and function syntax
  const ifPattern = new RegExp(/if\(|if \(/)
  const forPattern = new RegExp(/for\(|for \(|forEach\(|forEach \(/)
  const whilePattern = new RegExp(/while\(|while \(|do{ | do {/)
  const fetchPattern = new RegExp(/fetch\(|fetch \(/)
  const functionPattern = new RegExp(/function\(|function \(|=>{|=> {|\){|\) {|}\)|} \)/)
  const setPattern = new RegExp(/set\(|set \(/)
  const getPattern = new RegExp(/get\(|get \(/)
  const setTimeoutPattern = new RegExp(/setTimeout\(|setTimeout \(/)
  // anything .word(
  const dotFnPattern = new RegExp(/\.\w+\(/)
  // console.log("Patterns")
  // console.log(commonPatterns.test(str))
  // console.log(dotFnPattern.test(str))
  // console.log(ifPattern.test(str))
  // console.log(forPattern.test(str))
  // console.log(whilePattern.test(str))
  // console.log(fetchPattern.test(str))
  // console.log(functionPattern.test(str))
  // console.log(setPattern.test(str))
  // console.log(getPattern.test(str))
  // console.log(setTimeoutPattern.test(str)) 

  // console.log("Return")
  // console.log(
  //   commonPatterns.test(str)    ||
  //   dotFnPattern.test(str)      ||
  //   ifPattern.test(str)         ||
  //   forPattern.test(str)        ||
  //   whilePattern.test(str)      ||
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
    fetchPattern.test(str)      ||
    functionPattern.test(str)   ||
    setPattern.test(str)        ||
    getPattern.test(str)        ||
    setTimeoutPattern.test(str) 
  )

}

/**
 * For some string do some reasonable checks to see if it may contain something that seems like mongo commands.
 */ 
export function containsMongoCommandPattern(str) {
  // We can't process it, so technically is isn't suspicious
  if (str === null || str === undefined || typeof str !== "string") return false
  // Matches patterns like db.collection.method(...)
  const commandPattern = /db\.\w+\.\w+\(/
  // Matches common MongoDB operators
  const operatorPattern = /\$\w+/
  return commandPattern.test(str) || operatorPattern.test(str)
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

// In cases where we know the value should be a valid URL, it would be a suspicious error if it wasn't
export function isValidURLString(urlString) {
  if (!urlString) return false
  if (typeof urlString !== "string") return false
  const urlPattern = new RegExp(
    "^(https?://((localhost)|(([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9].)+[a-zA-Z]{2,})|(\\d{1,3}\\.){3}\\d{1,3})(:\\d+)?(/[-a-zA-Z0-9@:%_+.~#?&//=]*)?(\\?[;&a-zA-Z0-9@:%_+.~#?&//=]*)?(#[a-zA-Z0-9@:%_+.~#?&//=]*)?)$"
  )
  return urlPattern.test(urlString)
}

// In cases where we know the value should be a valid URL, it would be a suspicious error if it wasn't
export function isValidEmailAddressString(emailString) {
  if (!emailString) return false
  if (typeof emailString !== "string") return false
  const validEmail = new RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
  return validEmail.test(emailString)
}

/**
 * Check if the supplied input is valid JSON or not.
 * In cases where we know input should be valid JSON, it would be a suspcious error if it wasn't
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