const fs = require("fs-extra");
const yaml = require("yaml");
const path = require("path");

const mainService = require("./main_service");
const procedureServices = require("./procedure_services");
const databaseService = require("./database_service");

const databaseServiceKey = "db";

const includeDatabase = config => {
  switch (config.context) {
    case "view-store":
    case "event-store":
      return true;
  }
  return false;
};

module.exports = ({
  config,
  workingDir,
  context,
  port,
  mainContainerName,
  network,
  service,
  project,
  region,
  containerRegistery,
  domain,
  name,
  action,
  event,
  secretBucketKeyLocation,
  secretBucketKeyRing
}) => {
  const secretBucket = "smn-staging-secrets";
  const mongodbUser = "tester";
  const mongodbUserPassword = "password";
  const mongodbProtocol = "mongodb";
  const mongodbHost = "mongodb";
  const mongodbDatabase = "testing";
  const mongodbAdminUser = "admin";
  const mongodbAdminUserPassword = "password";
  const mongodbAdminDatabase = "admin";
  const env = "local";

  const _includeDatabase = includeDatabase(config);

  const _procedureServices = procedureServices({
    config,
    databaseServiceKey,
    project,
    port,
    env,
    network,
    service,
    domain,
    region,
    containerRegistery,
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
    mongodbProtocol
  });

  const compose = {
    version: "3",
    services: {
      main: {
        ...mainService({
          context,
          port,
          mainContainerName,
          network,
          service,
          project,
          region,
          env,
          containerRegistery,
          domain,
          name,
          action,
          event,
          secretBucket,
          secretBucketKeyLocation,
          secretBucketKeyRing,
          mongodbUser,
          mongodbHost,
          mongodbUserPassword,
          mongodbDatabase,
          mongodbProtocol
        }),
        depends_on: [
          ...(_includeDatabase ? [databaseServiceKey] : []),
          ...Object.keys(_procedureServices)
        ]
      },
      ..._procedureServices,
      ...(_includeDatabase && {
        [databaseServiceKey]: databaseService({
          adminUser: mongodbAdminUser,
          adminUserPassword: mongodbAdminUserPassword,
          adminDatabase: mongodbAdminDatabase,
          database: mongodbDatabase,
          user: mongodbUser,
          userPassword: mongodbUserPassword
        })
      })
    },
    networks: {
      default: {
        external: {
          name: "cloudbuild"
        }
      }
    }
  };

  const composePath = path.resolve(workingDir, "docker-compose.yaml");
  fs.writeFileSync(composePath, yaml.stringify(compose));
};
