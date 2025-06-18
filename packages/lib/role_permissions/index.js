export default async ({
  roles,
  defaultRoles,
  context,
  customRolePermissionsFn,
}) => {
  const permissions = [];
  const rolesFound = [];
  const nonDefaultRoles = [];

  for (const role of roles.filter(
    (role) => role.subject.network == process.env.NETWORK
  )) {
    if (
      context &&
      (role.subject.root != context.root ||
        role.subject.service != context.service ||
        role.subject.network != context.network)
    )
      continue;

    const defaultRole = defaultRoles[role.id];

    if (!defaultRole) {
      nonDefaultRoles.push(role);
      continue;
    }

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

  if (!customRolePermissionsFn || nonDefaultRoles.length == 0)
    return permissions;

  permissions.push(
    ...(
      await Promise.all(
        nonDefaultRoles.map((nonDefaultRole) =>
          customRolePermissionsFn({
            roleId: nonDefaultRole.id,
          })
        )
      )
    ).reduce((a, b) => a.concat(b))
  );

  return permissions;
};
