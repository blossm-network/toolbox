const difference = require("@blossm/array-difference");

module.exports = async ({ roles, defaultRoles, customRolePermissionsFn }) => {
  const permissions = [];

  const rolesFound = [];
  for (const role of roles) {
    for (const defaultRoleId in defaultRoles) {
      if (role.id == defaultRoleId) {
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
        rolesFound.push(role);
        break;
      }
    }
  }

  const customRoleCandidates = difference(
    roles.map(
      role => `${role.id}:${role.root}:${role.service}:${role.network}`
    ),
    rolesFound.map(
      role => `${role.id}:${role.root}:${role.service}:${role.network}`
    )
  ).map(stringRole => {
    const [id, root, service, network] = stringRole.split(":");
    return {
      id,
      root,
      service,
      network
    };
  });

  if (!customRolePermissionsFn || customRoleCandidates.length == 0)
    return permissions;

  permissions.push(
    ...(
      await Promise.all(
        customRoleCandidates.map(customRole =>
          customRolePermissionsFn({ roleId: customRole.id })
        )
      )
    ).reduce((a, b) => a.concat(b))
  );

  return permissions;
};
