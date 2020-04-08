const difference = require("@blossm/array-difference");

module.exports = async ({
  roles,
  defaultRoles,
  subcontext,
  customRolePermissionsFn
}) => {
  const permissions = [];
  const rolesFound = [];

  for (const role of roles) {
    if (
      subcontext &&
      role.root != subcontext.root &&
      role.service != subcontext.service &&
      role.network != subcontext.network
    )
      continue;

    const defaultRole = defaultRoles[role.id];

    if (!defaultRole) continue;

    permissions.push(
      ...defaultRole.permissions.map(permission => {
        const [service, domain, priviledge] = permission.split(":");
        return {
          priviledge,
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
            ...(subcontext && { subcontext })
          })
        )
      )
    ).reduce((a, b) => a.concat(b))
  );

  return permissions;
};
