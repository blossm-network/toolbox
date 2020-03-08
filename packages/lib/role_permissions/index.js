module.exports = async ({ roles, defaultRoles, customRolePermissionsFn }) => {
  const permissions = [];
  const customRoleCandidates = [];
  roles.reduce(async (result, roleId) => {
    const role = defaultRoles[roleId];
    if (role) {
      permissions.push(...role.permissions);
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
