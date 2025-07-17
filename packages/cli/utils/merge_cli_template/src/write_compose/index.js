import fs from "fs-extra";
import yaml from "yaml";
import path from "path";

import mainService from "./main_service.js";
import procedureServices from "./procedure_services.js";
import databaseService from "./database_service.js";

const databaseServiceKey = "db";

const includeDatabase = (config) => {
  switch (config.procedure) {
    case "view-store":
    case "event-store":
      return true;
  }
  return false;
};

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
  const mongodbDatabase = "testing";
  const mongodbAdminDatabase = "admin";

  const _includeDatabase = includeDatabase(config);

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
    mongodbDatabase,
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
    mongodbDatabase,
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
        depends_on: [
          ...(_includeDatabase ? [databaseServiceKey] : []),
          ...Object.keys(_procedureServices),
        ].filter((value, index, self) => {
          return self.indexOf(value) === index;
        }),
      },
      ..._procedureServices,
      ...(_includeDatabase && {
        [databaseServiceKey]: databaseService({
          adminDatabase: mongodbAdminDatabase,
          database: mongodbDatabase,
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
