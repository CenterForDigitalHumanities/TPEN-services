import Group from "../classes/Group/Group.js"

export default function scrubDefaultRoles(roleName) {
  const defaultRoles = Object.keys({
      OWNER: ["*_*_*"],
      LEADER: ["UPDATE_*_PROJECT", "READ_*_PROJECT", "*_*_MEMBER", "*_*_ROLE", "*_*_PERMISSION", "*_*_LAYER", "*_*_PAGE"],
      CONTRIBUTOR: ["READ_*_*", "UPDATE_TEXT_*", "UPDATE_ORDER_*", "UPDATE_SELECTOR_*", "CREATE_SELECTOR_*", "DELETE_*_LINE", "UPDATE_DESCRIPTION_LAYER", "CREATE_*_LAYER"],
      VIEWER: ["READ_*_PROJECT", "READ_*_MEMBER", "READ_*_LAYER", "READ_*_PAGE", "READ_*_LINE"]
  })
  if (Array.isArray(roleName)) {
    roleName = roleName.filter(roleString => {
      if (typeof roleString !== "string") throw new Error("Expecting a RolesMap and not an Array.")
      return !defaultRoles.includes(roleString)
    })
    return roleName.length !== 0 ? roleName : false
  }
  if (typeof roleName === "object") {
    for (const role of Object.keys(roleName)) {
      if (defaultRoles.includes(role)) delete roleName[role]
    }
    return Object.keys(roleName).length !== 0 ? roleName : false
  }
  return false
}
