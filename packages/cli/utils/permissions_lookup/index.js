import yaml from "yaml";
import { readFile, readdir, unlink } from "fs";
import { promisify } from "util";
import fact from "@blossm/fact-rpc";
import rolePermissions from "@blossm/role-permissions";
import uuid from "@blossm/uuid";
import * as redis from "@blossm/redis";
import { forbidden } from "@blossm/errors";
import nodeExternalToken from "@blossm/node-external-token";

const readFileAsync = promisify(readFile);
const readDirAsync = promisify(readdir);
const unlinkAsync = promisify(unlink);

const cacheKeyPrefix = "_permissions";
const FIVE_MINUTES_IN_SECONDS = 60 * 5;

export default ({ downloadFileFn }) => async ({
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
  if (cachedPermissions) return JSON.parse(cachedPermissions);

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
          },
          context: { principal, network: process.env.NETWORK },
        })
        .read({ query: { id: roleId } });

      return permissions;
    },
  });

  await redis.writeObject(cacheKey, {
    permissions: JSON.stringify(permissions),
  });
  await redis.setExpiry(cacheKey, { seconds: FIVE_MINUTES_IN_SECONDS });

  return permissions;
};
