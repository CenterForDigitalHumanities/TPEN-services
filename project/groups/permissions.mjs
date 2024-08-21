import Roles from "./roles.mjs"

const Permissions = {
  [Roles.OWNER]: {
    members: "MODIFY_ALL",
    project: "MODIFY_ALL",
    annotations: "MODIFY_ALL"
  },
  [Roles.LEADER]: {
    members: "MODIFY_ALL",
    project: "MODIFY_PAGES ADD_COLLECTIONS",
    annotations: "MODIFY_ALL"
  },
  [Roles.CONTRIBUTOR]: {
    members: "NONE",
    project: "MODIFY_PAGES ADD_COLLECTIONS",
    annotations: "MODIFY_ALL"
  },
  [Roles.VIEWER]: {
    members: "NONE",
    project: "READ_ONLY",
    annotations: "READ_ONLY"
  }
}

export default Permissions
