const difference = require("@blossm/array-difference");

module.exports = async ({ roles, defaultRoles, customRolePermissionsFn }) => {
  const permissions = [];

  const rolesFound = [];
  for (const roleId of roles) {
    for (const defaultRole of defaultRoles) {
      const role = defaultRole.roles[roleId];
      if (role) {
        permissions.push(
          ...role.priviledges.map(priviledge => {
            return {
              priviledge,
              service: defaultRole.service,
              domain: defaultRole.domain
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
