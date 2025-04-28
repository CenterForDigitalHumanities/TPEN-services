import Permissions from "./permissions.js"
import { ACTIONS, ENTITIES, SCOPES } from "./permissions_parameters.mjs"

const hasPermission = (role, action, scope, entity) => {
  const rolePermissions = Permissions[role]

  if (!rolePermissions) return false

   if (rolePermissions[action]?.[scope]?.includes(entity)) {
    return true
  }
 
  if (rolePermissions[ACTIONS.ALL]?.[SCOPES.ALL]?.includes(ENTITIES.ALL)) {
    return true
  }

   if (rolePermissions[ACTIONS.ALL]?.[scope]?.includes(entity)) {
    return true
  }

   if (rolePermissions[action]?.[SCOPES.ALL]?.includes(entity)) {
    return true
  }

  return false
}

export default hasPermission
