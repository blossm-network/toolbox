module.exports = async ({ roles, defaultRoles, customRolePermissionsFn }) => {
  const permissions = [];
  const customRoleCandidates = [];
  roles.reduce(async (result, roleId) => {
    const role = defaultRoles.roles[roleId];
    if (role) {
      permissions.push(
        ...role.priviledges.map(
          priviledge =>
            `${defaultRoles.service}:${defaultRoles.domain}:${priviledge}`
        )
      );
    } else {
      customRoleCandidates.push(roleId);
    }
    return result;
  }, []);
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
