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

module.exports = (config, workingDir) => {
  const _includeDatabase = includeDatabase(config);

  const _targetServices = targetServices({ config, databaseServiceKey });
  const compose = {
    version: "3",
    services: {
      main: {
        ...mainService(config.context),
        depends_on: [
          ...(_includeDatabase ? [databaseServiceKey] : []),
          ...Object.keys(_targetServices)
        ]
      },
      ..._targetServices,
      ...(_includeDatabase && {
        [databaseServiceKey]: databaseService
      })
    },
    networks: {
      default: {
        external: {
          name: "cloudbuild"
        }
      }
    },
    volumes: { "db-data": null }
  };

  const composePath = path.resolve(workingDir, "docker-compose.yaml");
  fs.writeFileSync(composePath, yaml.stringify(compose));
};
