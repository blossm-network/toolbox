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
  operationName,
  port,
  mainContainerName,
  network,
  context,
  env,
  host,
  service,
  baseNetwork,
  localBaseNetwork,
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
    baseNetwork,
    localBaseNetwork,
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
    localBaseNetwork,
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
