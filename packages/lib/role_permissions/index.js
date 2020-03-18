const difference = require("@blossm/array-difference");

module.exports = async ({ roles, defaultRoles, customRolePermissionsFn }) => {
  const permissions = [];

  const rolesFound = [];
  for (const roleId of roles) {
    for (const defaultRoleId in defaultRoles) {
      if (roleId == defaultRoleId) {
        permissions.push(
          ...defaultRoles[defaultRoleId].permissions.map(permission => {
            const [service, domain, priviledge] = permission.split(":");
            return {
              priviledge,
              service,
              domain
            };
          })
        );
        rolesFound.push(roleId);
        break;
      }
    }
  }
  const customRoleCandidates = difference(roles, rolesFound);
  if (customRoleCandidates.length > 0) {
    permissions.push(
      ...(
        await Promise.all(
          customRoleCandidates.map(customRole =>
            customRolePermissionsFn({ roleId: customRole })
          )
        )
      ).reduce((a, b) => a.concat(b))
    );
  }

  return permissions;
};
