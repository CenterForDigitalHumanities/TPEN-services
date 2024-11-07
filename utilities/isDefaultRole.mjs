import Group from "../classes/Group/Group.mjs"
import { respondWithError } from "../utilities/shared.mjs"

export default function scrubDefaultRoles(roleName) {
  
  const defaultRoles = Object.keys(Group.defaultRoles)
  if(Array.isArray(roleName)) {
    roleName = roleName.filter(roleString => {
      if(typeof roleString !== "string") {
        respondWithError(res, 400, "Expecting a RolesMap and not an Array.")
      }
      return !defaultRoles.includes(roleString)
    })
    return roleName.length !== 0 ? roleName : false
  }

  if (typeof roleName === "object") {
    for (const role of Object.keys(roleName)) {
      if (defaultRoles.includes(role)) {
        delete roleName[role]
      }
    }
    return Object.keys(roleName).length !== 0 ? roleName : false
  }

  return false
}
