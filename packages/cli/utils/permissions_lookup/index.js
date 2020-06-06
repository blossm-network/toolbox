const yaml = require("yaml");
const { readFile, readdir, unlink } = require("fs");
const { promisify } = require("util");
const fact = require("@blossm/fact-rpc");
const rolePermissions = require("@blossm/role-permissions");
const uuid = require("@blossm/uuid");
const { forbidden } = require("@blossm/errors");
const nodeExternalToken = require("@blossm/node-external-token");

const readFileAsync = promisify(readFile);
const readDirAsync = promisify(readdir);
const unlinkAsync = promisify(unlink);

let defaultRoles;

module.exports = ({ downloadFileFn }) => async ({
  internalTokenFn,
  externalTokenFn,
  principal,
  context,
}) => {
  if (!principal) throw forbidden.message("Missing required permissions.");

  //Download files if they aren't downloaded already.
  if (!defaultRoles) {
    const fileName = uuid();
    const extension = ".yaml";
    defaultRoles = {};
    await downloadFileFn({ fileName, extension });
    const files = (await readDirAsync(".")).filter(
      (file) => file.startsWith(fileName) && file.endsWith(extension)
    );

    await Promise.all(
      files.map(async (file) => {
        const role = await readFileAsync(file);
        const defaultRole = yaml.parse(role.toString());
        defaultRoles = {
          ...defaultRoles,
          ...defaultRole,
        };
        await unlinkAsync(file);
      })
    );
  }

  const { body: roles } = await fact({
    name: "roles",
    domain: "principal",
    service: principal.service,
    network: principal.network,
  })
    .set({
      token: { internalFn: internalTokenFn, externalFn: externalTokenFn },
      context: { network: process.env.NETWORK },
    })
    .read({ root: principal.root });

  return await rolePermissions({
    roles,
    defaultRoles,
    context,
    customRolePermissionsFn: async ({ roleId }) => {
      const { body: permissions } = await fact({
        name: "permissions",
        domain: "role",
        service: "core",
        ...(process.env.CORE_NETWORK && {
          network: process.env.CORE_NETWORK,
        }),
      })
        .set({
          token: {
            internalFn: internalTokenFn,
            externalFn: nodeExternalToken,
            key: "access",
          },
          context: { network: process.env.NETWORK },
        })
        .read({ id: roleId });

      return permissions;
    },
  });
};
