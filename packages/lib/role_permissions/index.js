const difference = require("@blossm/array-difference");

module.exports = async ({ roles, defaultRoles, customRolePermissionsFn }) => {
  const permissions = [];

  const rolesFound = [];
  for (const roleId of roles) {
    //TODO
    //eslint-disable-next-line
    console.log({ roleId });
    for (const defaultRole of defaultRoles) {
      const role = defaultRole.roles[roleId];
      //TODO
      //eslint-disable-next-line
      console.log({ defaultRole, role });
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
  //TODO
  //eslint-disable-next-line
  console.log({ customRoleCandidates });
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

  //TODO
  //eslint-disable-next-line
  console.log({ donePermissions: permissions });
  return permissions;
};
