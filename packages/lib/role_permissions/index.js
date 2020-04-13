const difference = require("@blossm/array-difference");

module.exports = async ({
  roles,
  defaultRoles,
  context,
  customRolePermissionsFn
}) => {
  const permissions = [];
  const rolesFound = [];

  for (const role of roles) {
    if (
      context &&
      role.root != context.root &&
      role.service != context.service &&
      role.network != context.network
    )
      continue;

    const defaultRole = defaultRoles[role.id];

    if (!defaultRole) continue;

    permissions.push(
      ...defaultRole.permissions.map(permission => {
        const [service, domain, privilege] = permission.split(":");
        return {
          privilege,
          service,
          domain
        };
      })
    );
    rolesFound.push(role);
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
          customRolePermissionsFn({
            roleId: customRole.id,
            ...(context && { context })
          })
        )
      )
    ).reduce((a, b) => a.concat(b))
  );

  return permissions;
};
