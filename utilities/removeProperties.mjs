

/**
 * filters object 
 * @param {*} obj the object to be filtered
 * @param {*} propertiesToRemove the properties to be removed, e.g profile, password, links; array of strings
 * @returns all properties of the except except one specified
 */
export const removeProperties = (obj, ...propertiesToRemove)=>{
 if(!obj) return
 const { ...modifiedObj } = obj;
 for (const property of propertiesToRemove) {
     delete modifiedObj[property];
    }
    return modifiedObj
   // publicUser.links = profile?.links //Assuming something in the profile object is public. Note that profile has to be sourced from the destructure as  const {profile, ...modifiedObj } = obj;
} 


/**
 * 
 * @param {*} obj object to be filtered
 * @param {*} property the only property to return; string
 * @returns object with one property
 */
export const includeOnly = (obj, property)=>{
  let filteredObj = {}

  for(const key in obj){
    if (key === property){
      filteredObj[key] = obj[key]
    }
  }

  return filteredObj
}