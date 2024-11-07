import Group from "../classes/Group/Group.mjs";

export default function isDefaultRole(roleName) {
  const defaultRoles = Object.keys(Group.defaultRoles);

  if (typeof roleName === "object" && !Array.isArray(roleName)) {
    for (const role of Object.keys(roleName)) {
      if (defaultRoles.includes(role)) {
        return [true, role];
      }
    }
    return [false, ''];
  }

  if (Array.isArray(roleName)) {
    for (const role of roleName) {
      if (defaultRoles.includes(role)) {
        return [true, role];
      }
    }
    return [false, ''];
  }

  if (typeof roleName === "string") {
    if (defaultRoles.includes(roleName)) {
      return [true, roleName];
    }
    return [false, ''];
  }

  return [false, 'Invalid role format'];
}
