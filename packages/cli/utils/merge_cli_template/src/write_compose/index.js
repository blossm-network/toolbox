const fs = require("fs-extra");
const yaml = require("yaml");
const path = require("path");

const mainService = require("./main_service");
const procedureServices = require("./procedure_services");
const databaseService = require("./database_service");

const databaseServiceKey = "db";

const includeDatabase = (config) => {
  switch (config.procedure) {
    case "view-store":
    case "event-store":
      return true;
  }
  return false;
};

module.exports = ({
  config,
  workingDir,
  procedure,
  publicKeyUrl,
  operationHash,
  port,
  mainContainerName,
  network,
  context,
  host,
  service,
  coreNetwork,
  project,
  region,
  containerRegistery,
  coreContainerRegistery,
  domain,
  name,
  store,
  env,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  secretBucket,
  envVars,
  dependencyKeyEnvironmentVariables,
}) => {
  const mongodbUser = "tester";
  const mongodbUserPassword = "password";
  const mongodbProtocol = "mongodb";
  const mongodbHost = "mongodb";
  const mongodbDatabase = "testing";
  const mongodbAdminUser = "admin";
  const mongodbAdminUserPassword = "password";
  const mongodbAdminDatabase = "admin";

  const _includeDatabase = includeDatabase(config);

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
    containerRegistery,
    coreContainerRegistery,
    secretBucket,
    secretBucketKeyLocation,
    secretBucketKeyRing,
    mongodbAdminUser,
    mongodbAdminUserPassword,
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
    coreNetwork,
    context,
    network,
    host,
    service,
    project,
    region,
    containerRegistery,
    domain,
    name,
    store,
    secretBucket,
    secretBucketKeyLocation,
    secretBucketKeyRing,
    mongodbUser,
    mongodbHost,
    mongodbUserPassword,
    mongodbDatabase,
    mongodbProtocol,
    envVars,
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
        ],
      },
      ..._procedureServices,
      ...(_includeDatabase && {
        [databaseServiceKey]: databaseService({
          adminUser: mongodbAdminUser,
          adminUserPassword: mongodbAdminUserPassword,
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
