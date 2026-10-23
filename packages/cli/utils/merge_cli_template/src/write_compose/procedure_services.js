import yaml from "yaml";
import path from "path";
import fs from "fs-extra";

import hash, { environment as operationIdentityEnvironment } from "@blossm/operation-hash";
import rootDir from "@blossm/cli-root-dir";

import databaseService from "./database_service.js";
import mainService from "./main_service.js";

// Index source configs once; installed/generated trees and symlinks are not procedures.
const dependencyConfigs = (dir, configs = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const filePath = path.join(dir, entry.name);
    if (entry.isFile() && ["blossm.yaml", "blossm.yml"].includes(entry.name)) {
      configs.push(yaml.parse(fs.readFileSync(filePath, "utf8")));
    } else if (entry.isDirectory() && !["node_modules", ".git", ".blossm", "dist", "build"].includes(entry.name)) {
      dependencyConfigs(filePath, configs);
    }
  }
  return configs;
};

const findEnvForDependency = (env, dependency, configs, network) => {
  const matches = configs.filter(config =>
    ["procedure", "domain", "service", "name", "context"].every(key =>
      (dependency[key] ?? null) === (config[key] ?? null)
    ) && (dependency.network || network) === (config.network || network)
  );
  if (matches.length > 1) throw new Error("Ambiguous dependency procedure configuration.");
  return matches[0]?.env?.[env];
};

export default ({
  config,
  databaseServiceKey,
  project,
  port,
  localCoreNetwork,
  network,
  host,
  region,
  env,
  containerRegistery,
  baseContainerRegistery,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  mongodbAdminDatabase,
  mongodbDatabase,
  mongodbHost,
  mongodbProtocol,
  mongodbUser,
  mongodbUserPassword,
  dependencyKeyEnvironmentVariables,
}) => {
  const identityEnvironment = operationIdentityEnvironment();
  const common = {
    ports: [`${port}`],
  };
  const commonEnvironment = {
    PORT: `${port}`,
    NODE_ENV: "local",
    NETWORK: network,
    CORE_NETWORK: localCoreNetwork,
    HOST: host,
    GCP_PROJECT: project,
    GCP_REGION: region,
    GCP_SECRET_BUCKET: secretBucket,
    GCP_KMS_SECRET_BUCKET_KEY_LOCATION: secretBucketKeyLocation,
    GCP_KMS_SECRET_BUCKET_KEY_RING: secretBucketKeyRing,
    ...dependencyKeyEnvironmentVariables,
    ...identityEnvironment,
  };
  const commonStoreEnvironment = {
    MONGODB_USER: `${mongodbUser}`,
    MONGODB_HOST: `${mongodbHost}`,
    MONGODB_USER_PASSWORD: `${mongodbUserPassword}`,
    MONGODB_PROTOCOL: `${mongodbProtocol}`,
    MONGODB_DATABASE: `${mongodbDatabase}`,
  };

  let services = {};
  let includeDatabase = false;
  const configs = config.testing.dependencies.some(dependency => dependency.procedure != "http")
    ? dependencyConfigs(rootDir.path()) : [];
  for (const dependency of config.testing.dependencies) {
    const customEnv = findEnvForDependency(env, dependency, configs, network);

    const registry = localCoreNetwork && dependency.network == localCoreNetwork
      ? baseContainerRegistery
      : containerRegistery;
    const commonServiceImagePrefix = `${registry}/${dependency.procedure}`;

    switch (dependency.procedure) {
      case "http": {
        services = {
          ...services,
          [dependency.host]: {
            ...common,
            ...(dependency.port && { ports: [`${dependency.port}`] }),
            build: "./http_dependency",
            container_name: dependency.host,
            environment: {
              PORT: `${port}`,
              MOCKS: JSON.stringify(dependency.mocks),
            },
          },
        };
        break;
      }
      case "view-store":
        {
          const operationHash = hash(
            dependency.name,
            ...(dependency.context ? [dependency.context] : []),
            dependency.procedure
          );

          const key = `${dependency.name}${
            dependency.context ? `-${dependency.context}` : ""
          }`;

          services = {
            ...services,
            [key]: {
              ...common,
              image: mainService({ ...dependency, containerRegistery: registry }).image,
              container_name: `${operationHash}.${network}`,
              depends_on: [databaseServiceKey],
              environment: {
                ...commonEnvironment,
                ...commonStoreEnvironment,
                PROCEDURE: dependency.procedure,
                OPERATION_HASH: operationHash,
                ...(dependency.context && { CONTEXT: dependency.context }),
                NAME: dependency.name,
              },
            },
          };
          includeDatabase = true;
        }
        break;
      case "view-composite":
        {
          const operationHash = hash(
            dependency.name,
            dependency.context,
            dependency.procedure
          );

          const key = `${dependency.name}${dependency.context ? `-${dependency.context}` : ""}`;

          services = {
            ...services,
            [key]: {
              ...common,
              image: mainService({ ...dependency, containerRegistery: registry }).image,
              container_name: `${operationHash}.${network}`,
              environment: {
                ...commonEnvironment,
                PROCEDURE: dependency.procedure,
                OPERATION_HASH: operationHash,
                ...(dependency.context && { CONTEXT: dependency.context }),
                NAME: dependency.name,
              },
            },
          };
        }
        break;
      case "event-store":
        {
          const operationHash = hash(
            dependency.domain,
            dependency.service,
            dependency.procedure
          );

          const key = `${dependency.domain}-${dependency.service}`;
          services = {
            ...services,
            [key]: {
              ...common,
              image: `${commonServiceImagePrefix}.${dependency.service}.${dependency.domain}:latest`,
              container_name: `${operationHash}.${network}`,
              depends_on: [databaseServiceKey],
              environment: {
                ...commonEnvironment,
                ...commonStoreEnvironment,
                PROCEDURE: dependency.procedure,
                OPERATION_HASH: operationHash,
                DOMAIN: dependency.domain,
                SERVICE: dependency.service,
              },
            },
          };
          includeDatabase = true;
        }
        break;
      case "command":
        {
          const operationHash = hash(
            dependency.name,
            dependency.domain,
            dependency.service,
            dependency.procedure
          );
          const key = `${dependency.name}-${dependency.domain}-${dependency.service}`;
          services = {
            ...services,
            [key]: {
              ...common,
              image: `${commonServiceImagePrefix}.${dependency.service}.${dependency.domain}.${dependency.name}:latest`,
              container_name: `${operationHash}.${network}`,
              environment: {
                ...commonEnvironment,
                PROCEDURE: dependency.procedure,
                OPERATION_HASH: operationHash,
                DOMAIN: dependency.domain,
                SERVICE: dependency.service,
                NAME: dependency.name,
                ...customEnv,
                ...identityEnvironment,
              },
            },
          };
        }
        break;
      case "fact":
        {
          const operationHash = hash(
            dependency.name,
            ...(dependency.domain ? [dependency.domain] : []),
            ...(dependency.service ? [dependency.service] : []),
            dependency.procedure
          );
          const key = `${dependency.name}${
            dependency.domain ? `-${dependency.domain}` : ""
          }${config.service ? `-${dependency.service}` : ""}`;
          services = {
            ...services,
            [key]: {
              ...common,
              image: `${commonServiceImagePrefix}${
                dependency.service ? `.${dependency.service}` : ""
              }${dependency.domain ? `.${dependency.domain}` : ""}.${
                dependency.name
              }:latest`,
              container_name: `${operationHash}.${network}`,
              environment: {
                ...commonEnvironment,
                PROCEDURE: dependency.procedure,
                OPERATION_HASH: operationHash,
                ...(dependency.domain && { DOMAIN: dependency.domain }),
                ...(dependency.service && { SERVICE: dependency.service }),
                NAME: dependency.name,
                ...customEnv,
                ...identityEnvironment,
              },
            },
          };
        }
        break;
    }
  }
  return {
    ...services,
    ...(includeDatabase
      ? {
          [databaseServiceKey]: databaseService({
            adminDatabase: mongodbAdminDatabase,
            database: mongodbDatabase,
            user: mongodbUser,
            userPassword: mongodbUserPassword,
          }),
        }
      : []),
  };
};
