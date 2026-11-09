import yaml from "yaml";
import path from "path";
import fs from "fs-extra";

import hash from "@blossm/operation-hash";
import rootDir from "@blossm/cli-root-dir";

import databaseName from "../database_name.js";
import mainService from "./main_service.js";

// Scan this workspace once. Never follow symlinks or installed/generated trees.
const dependencyConfigs = (dir, configs = [], root = dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  if (
    dir !== root &&
    entries.some(
      (entry) =>
        entry.name === "config.yaml" &&
        (entry.isFile() || entry.isSymbolicLink()),
    )
  )
    return configs;
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    const filePath = path.join(dir, entry.name);
    if (entry.isFile() && ["blossm.yaml", "blossm.yml"].includes(entry.name)) {
      let config;
      try {
        config = yaml.parse(fs.readFileSync(filePath, "utf8"));
      } catch (cause) {
        throw new Error(`Invalid procedure configuration: ${filePath}`, {
          cause,
        });
      }
      if (config?.procedure) configs.push({ config, file: filePath });
    } else if (
      entry.isDirectory() &&
      !["node_modules", ".git", ".blossm", ".nx"].includes(entry.name)
    ) {
      dependencyConfigs(filePath, configs, root);
    }
  }
  return configs;
};

const findEnvForDependency = (env, dependency, configs, networks) => {
  // Source identity uses real networks; local aliases belong to Compose routing.
  const sourceNetwork = (value) =>
    value == undefined || value === networks.local
      ? networks.source
      : value === networks.localCore
        ? networks.core
        : value;
  const matches = configs.filter(
    ({ config }) =>
      ["procedure", "domain", "service", "name", "context"].every(
        (key) => (dependency[key] ?? null) === (config[key] ?? null),
      ) && sourceNetwork(dependency.network) === sourceNetwork(config.network),
  );
  if (matches.length > 1)
    throw new Error(
      `Ambiguous dependency procedure configuration: ${matches.map(({ file }) => file).join(", ")}`,
    );
  return matches[0]?.config.env?.[env];
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
  mongodbHost,
  mongodbProtocol,
  mongodbUser,
  mongodbUserPassword,
  dependencyKeyEnvironmentVariables,
}) => {
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
  };
  const commonStoreEnvironment = {
    MONGODB_USER: `${mongodbUser}`,
    MONGODB_HOST: `${mongodbHost}`,
    MONGODB_USER_PASSWORD: `${mongodbUserPassword}`,
    MONGODB_PROTOCOL: `${mongodbProtocol}`,
  };

  let services = {};
  const needsConfigs = config.testing.dependencies.some(
    (dependency) => dependency.procedure !== "http",
  );
  const workspace = needsConfigs ? rootDir.config() : {};
  const configs = needsConfigs ? dependencyConfigs(rootDir.path()) : [];
  const networks = {
    source: workspace.network,
    core: workspace.core?.network ?? workspace.network,
    local: network,
    localCore: localCoreNetwork,
  };
  for (const dependency of config.testing.dependencies) {
    const customEnv = findEnvForDependency(env, dependency, configs, networks);

    const registry =
      localCoreNetwork && dependency.network == localCoreNetwork
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
            dependency.procedure,
          );

          const key = operationHash;

          services = {
            ...services,
            [key]: {
              ...common,
              image: mainService({
                ...dependency,
                containerRegistery: registry,
              }).image,
              container_name: `${operationHash}.${network}`,
              depends_on: [databaseServiceKey],
              environment: {
                ...commonEnvironment,
                ...commonStoreEnvironment,
                MONGODB_DATABASE: databaseName(dependency),
                PROCEDURE: dependency.procedure,
                OPERATION_HASH: operationHash,
                ...(dependency.context && { CONTEXT: dependency.context }),
                NAME: dependency.name,
              },
            },
          };
        }
        break;
      case "view-composite":
        {
          const operationHash = hash(
            dependency.name,
            dependency.context,
            dependency.procedure,
          );

          const key = operationHash;

          services = {
            ...services,
            [key]: {
              ...common,
              image: mainService({
                ...dependency,
                containerRegistery: registry,
              }).image,
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
            dependency.procedure,
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
                MONGODB_DATABASE: databaseName(dependency),
                PROCEDURE: dependency.procedure,
                OPERATION_HASH: operationHash,
                DOMAIN: dependency.domain,
                SERVICE: dependency.service,
              },
            },
          };
        }
        break;
      case "command":
        {
          const operationHash = hash(
            dependency.name,
            dependency.domain,
            dependency.service,
            dependency.procedure,
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
            dependency.procedure,
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
              },
            },
          };
        }
        break;
    }
  }
  return services;
};
