import fs from "fs-extra";
import yaml from "yaml";
import path from "path";

import mainService from "./main_service.js";
import procedureServices from "./procedure_services.js";
import databaseService from "./database_service.js";
import postgresService, {
  postgresServiceKey,
  postgresReady,
} from "./postgres_service.js";
import databaseName from "../database_name.js";

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
  eventStore,
}) => {
  const mongodbUser = "tester";
  const mongodbUserPassword = "password";
  const mongodbProtocol = "mongodb";
  const mongodbHost = "mongodb";
  const mongodbAdminDatabase = "admin";

  // PostgreSQL event stores use their own fixture; Mongo serves the rest.
  const stores = [
    { procedure, service, domain, context, name },
    ...config.testing.dependencies,
  ];
  const usesPostgres =
    eventStore == "postgres" &&
    stores.some((store) => store.procedure == "event-store");
  const databases = [
    ...new Set(
      stores
        .filter((store) => !usesPostgres || store.procedure != "event-store")
        .map(databaseName)
        .filter(Boolean)
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
    mongodbUser,
    mongodbUserPassword,
    mongodbHost,
    mongodbProtocol,
    dependencyKeyEnvironmentVariables,
    eventStore,
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
    eventStore,
  });

  const dependsOn = [
    ...(databases.length ? [databaseServiceKey] : []),
    ...Object.keys(_procedureServices),
  ].filter((value, index, self) => self.indexOf(value) === index);

  const compose = {
    version: "3",
    services: {
      main: {
        ...main,
        // Only a main PostgreSQL event store connects at startup, so it alone
        // waits for the fixture to accept connections.
        depends_on:
          usesPostgres && procedure == "event-store"
            ? {
                ...Object.fromEntries(
                  dependsOn.map((key) => [key, { condition: "service_started" }])
                ),
                ...postgresReady,
              }
            : dependsOn,
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
      ...(usesPostgres && { [postgresServiceKey]: postgresService() }),
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
