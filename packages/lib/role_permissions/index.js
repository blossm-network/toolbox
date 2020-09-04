const difference = require("@blossm/array-difference");

module.exports = async ({
  roles,
  defaultRoles,
  context,
  customRolePermissionsFn,
}) => {
  const permissions = [];
  const rolesFound = [];

  //TODO
  console.log({
    roles: JSON.stringify(roles),
    context,
    defaultRoles: JSON.stringify(defaultRoles),
  });

  for (const role of roles) {
    if (
      context &&
      role.subject.root != context.root &&
      role.subject.service != context.service &&
      role.subject.network != context.network
    )
      continue;

    const defaultRole = defaultRoles[role.id];

    if (!defaultRole) continue;

    permissions.push(
      ...defaultRole.permissions.map((permission) => {
        const [service, domain, privilege] = permission.split(":");
        return {
          privilege,
          service,
          domain,
        };
      })
    );
    rolesFound.push(role);
  }

  const customRoleCandidates = difference(
    roles
      .filter((role) => role.subject.network == process.env.NETWORK)
      .map(
        (role) =>
          `${role.id}:${role.subject.root}:${role.subject.domain}:${role.subject.service}:${role.subject.network}`
      ),
    rolesFound.map(
      (role) =>
        `${role.id}:${role.subject.root}:${role.subject.domain}:${role.subject.service}:${role.subject.network}`
    )
  ).map((stringRole) => {
    const [id, root, domain, service, network] = stringRole.split(":");
    return {
      id,
      root,
      domain,
      service,
      network,
    };
  });

  if (!customRolePermissionsFn || customRoleCandidates.length == 0)
    return permissions;

  permissions.push(
    ...(
      await Promise.all(
        customRoleCandidates.map((customRole) =>
          customRolePermissionsFn({
            roleId: customRole.id,
            ...(context && { context }),
          })
        )
      )
    ).reduce((a, b) => a.concat(b))
  );

  return permissions;
};
