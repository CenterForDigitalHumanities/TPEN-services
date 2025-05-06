import Roles from "./roles.js"

const Permissions = {
  [Roles.OWNER]: ["*_*_*"],  
  
  [Roles.LEADER]: [
    "UPDATE_*_PROJECT",
    "*_*_MEMBER", 
    "*_*_ROLE",
    "*_*_PERMISSION",
    "*_*_LAYER",
    "*_*_PAGE"
  ],
  
  [Roles.CONTRIBUTOR]: [
    "READ_*_MEMBER",
    "UPDATE_TEXT_*",
    "UPDATE_ORDER_*",
    "UPDATE_SELECTOR_*",
    "CREATE_SELECTOR_*",
    "DELETE_*_LINE",
    "UPDATE_DESCRIPTION_LAYER",
    "CREATE_*_LAYER"
  ],

  [Roles.VIEWER]: [
    "READ_*_*"
  ]
}

export default Permissions
