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
