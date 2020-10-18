const yaml = require("yaml");
const { readFile, readdir, unlink } = require("fs");
const { promisify } = require("util");
const fact = require("@blossm/fact-rpc");
const rolePermissions = require("@blossm/role-permissions");
const uuid = require("@blossm/uuid");
const redis = require("@blossm/redis");
const { forbidden } = require("@blossm/errors");
const nodeExternalToken = require("@blossm/node-external-token");

const readFileAsync = promisify(readFile);
const readDirAsync = promisify(readdir);
const unlinkAsync = promisify(unlink);

const cacheKeyPrefix = "_permissions";
const FIVE_MINUTES_IN_SECONDS = 60 * 5;

module.exports = ({ downloadFileFn }) => async ({
  internalTokenFn,
  externalTokenFn,
  principal,
  context,
}) => {
  if (!principal) throw forbidden.message("Missing required permissions.");

  const cacheKey = `${cacheKeyPrefix}.${principal.root}.${principal.service}.${principal.network}`;

  //Lookup permissions in cache. If found, use them.
  let { permissions: cachedPermissions } =
    (await redis.readObject(cacheKey)) || {};
  if (cachedPermissions) return cachedPermissions;

  //Download files if they aren't downloaded already.
  const fileName = uuid();
  const extension = ".yaml";
  let defaultRoles = {};
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

  const { body: roles } = await fact({
    name: "roles",
    domain: "principal",
    service: principal.service,
    network: principal.network,
  })
    .set({
      token: { internalFn: internalTokenFn, externalFn: externalTokenFn },
      context: {
        principal,
        network: process.env.NETWORK,
      },
    })
    .read();

  const permissions = await rolePermissions({
    roles,
    defaultRoles,
    context,
    customRolePermissionsFn: async ({ roleId }) => {
      const { body: permissions } = await fact({
        name: "permissions",
        domain: "role",
        service: "base",
        ...(process.env.BASE_NETWORK && {
          network: process.env.BASE_NETWORK,
        }),
      })
        .set({
          token: {
            internalFn: internalTokenFn,
            externalFn: nodeExternalToken,
            key: "access",
          },
          context: { principal, network: process.env.NETWORK },
        })
        .read({ query: { id: roleId } });

      return permissions;
    },
  });

  await redis.writeObject(cacheKey, {
    permissions,
  });
  await redis.setExpiry(cacheKey, { FIVE_MINUTES_IN_SECONDS });

  return permissions;
};
