const fs = require("fs-extra");
const yaml = require("yaml");
const path = require("path");

const mainService = require("./main_service");
const targetServices = require("./target_services");
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
  secretBucketKeyLocation,
  secretBucketKeyRing
}) => {
  const secretBucket = "smn-staging-secrets";
  const mongodbUser = "tester";
  const mongodbUserPassword = "password";
  const mongodbProtocol = "mongodb";
  const mongodbHost = "mongodb";
  const mongodbDatabase = "testing";
  const env = "local";

  const _includeDatabase = includeDatabase(config);

  const _targetServices = targetServices({
    config,
    databaseServiceKey,
    project,
    port,
    env,
    network,
    service,
    region,
    secretBucket,
    secretBucketKeyLocation,
    secretBucketKeyRing
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
          ...Object.keys(_targetServices)
        ]
      },
      ..._targetServices,
      ...(_includeDatabase && {
        [databaseServiceKey]: databaseService({
          adminUser: "admin",
          adminUserPassword: "password",
          adminDatabase: "admin",
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
  //eslint-disable-next-line
  console.log("compose: ", compose);
  fs.writeFileSync(composePath, yaml.stringify(compose));
};
