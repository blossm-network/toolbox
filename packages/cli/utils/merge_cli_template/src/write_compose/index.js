import fs from "fs-extra";
import yaml from "yaml";
import path from "path";

import mainService from "./main_service.js";
import procedureServices from "./procedure_services.js";
import databaseService from "./database_service.js";
import databaseName from "./database_name.js";

const databaseServiceKey = "db";

export default ({
  config,
  workingDir,
  procedure,
  publicKeyUrl,
  operationHash,
  operationName,
  port,
  mainContainerName,
  network,
  context,
  env,
  host,
  service,
  coreNetwork,
  localCoreNetwork,
  project,
  region,
  containerRegistery,
  baseContainerRegistery,
  domain,
  name,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  secretBucket,
  envVars,
  devEnvVars,
  dependencyKeyEnvironmentVariables,
}) => {
  const mongodbUser = "tester";
  const mongodbUserPassword = "password";
  const mongodbProtocol = "mongodb";
  const mongodbHost = "mongodb";
  const mongodbAdminDatabase = "admin";

  const databases = [
    ...new Set(
      [
        databaseName({ procedure, service, domain, context, name }),
        ...config.testing.dependencies.map(databaseName),
      ].filter(Boolean)
    ),
  ];

  const serviceName = `${region}-${operationName}-${operationHash}`;

  const _procedureServices = procedureServices({
    config,
    databaseServiceKey,
    project,
    port,
    env,
    network,
    host,
    context,
    region,
    coreNetwork,
    localCoreNetwork,
    operationHash,
    containerRegistery,
    baseContainerRegistery,
    secretBucket,
    secretBucketKeyLocation,
    secretBucketKeyRing,
    mongodbAdminDatabase,
    mongodbUser,
    mongodbUserPassword,
    mongodbHost,
    mongodbProtocol,
    dependencyKeyEnvironmentVariables,
  });

  const main = mainService({
    procedure,
    operationHash,
    port,
    mainContainerName,
    publicKeyUrl,
    context,
    network,
    host,
    serviceName,
    service,
    project,
    region,
    containerRegistery,
    domain,
    localCoreNetwork,
    name,
    secretBucket,
    secretBucketKeyLocation,
    secretBucketKeyRing,
    mongodbUser,
    mongodbHost,
    mongodbUserPassword,
    mongodbProtocol,
    envVars,
    devEnvVars,
    dependencyKeyEnvironmentVariables,
  });

  const compose = {
    version: "3",
    services: {
      main: {
        ...main,
        depends_on: {
          ...(databases.length && {
            [databaseServiceKey]: { condition: "service_healthy" },
          }),
          ...Object.fromEntries(
            Object.keys(_procedureServices).map((key) => [
              key,
              { condition: "service_started" },
            ])
          ),
        },
      },
      ..._procedureServices,
      ...(databases.length > 0 && {
        [databaseServiceKey]: databaseService({
          adminDatabase: mongodbAdminDatabase,
          databases,
          user: mongodbUser,
          userPassword: mongodbUserPassword,
        }),
      }),
    },
    networks: {
      default: {
        external: {
          name: "cloudbuild",
        },
      },
    },
  };

  const composePath = path.resolve(workingDir, "docker-compose.yaml");
  fs.writeFileSync(composePath, yaml.stringify(compose));
};
