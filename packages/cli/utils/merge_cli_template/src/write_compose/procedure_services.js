const hash = require("@blossm/operation-hash");

const databaseService = require("./database_service");

module.exports = ({
  config,
  databaseServiceKey,
  project,
  port,
  env,
  coreNetwork,
  network,
  host,
  region,
  containerRegistery,
  coreContainerRegistery,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  mongodbAdminUser,
  mongodbAdminUserPassword,
  mongodbAdminDatabase,
  mongodbDatabase,
  mongodbHost,
  mongodbProtocol,
  mongodbUser,
  mongodbUserPassword,
  twilioSendingPhoneNumber,
  twilioTestReceivingPhoneNumber,
  dependencyKeyEnvironmentVariables,
}) => {
  const common = {
    ports: [`${port}`],
  };
  const commonEnvironment = {
    PORT: `${port}`,
    NODE_ENV: env,
    NETWORK: network,
    CORE_NETWORK: coreNetwork,
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
    MONGODB_DATABASE: `${mongodbDatabase}`,
  };
  let services = {};
  let includeDatabase = false;
  for (const dependency of config.testing.dependencies) {
    const commonServiceImagePrefix = `${
      coreNetwork && dependency.network == coreNetwork
        ? coreContainerRegistery
        : containerRegistery
    }/${dependency.procedure}`;
    switch (dependency.procedure) {
      case "http": {
        services = {
          ...services,
          [dependency.host]: {
            ...common,
            build: "./http_dependency",
            container_name: dependency.host,
            environment: {
              PORT: `${port}`,
              PATH: dependency.mock.path,
              RESPONSE:
                typeof dependency.mock.response == "string"
                  ? dependency.mock.response
                  : JSON.stringify(dependency.mock.response),
              CODE: dependency.mock.code,
            },
          },
        };
        break;
      }
      case "view-store":
        {
          const operationHash = hash(
            dependency.name,
            ...(dependency.domain ? [dependency.domain] : []),
            ...(dependency.service ? [dependency.service] : []),
            dependency.context,
            dependency.procedure
          );

          const key = `${dependency.name}${
            dependency.domain ? `-${dependency.domain}` : ""
          }${dependency.service ? `-${dependency.service}` : ""}-${
            config.context
          }`;

          services = {
            ...services,
            [key]: {
              ...common,
              image: `${commonServiceImagePrefix}.${dependency.context}${
                dependency.domain ? `.${dependency.domain}` : ""
              }${dependency.service ? `.${dependency.service}` : ""}.${
                dependency.name
              }:latest`,
              container_name: `${operationHash}.${network}`,
              depends_on: [databaseServiceKey],
              environment: {
                ...commonEnvironment,
                ...commonStoreEnvironment,
                PROCEDURE: dependency.procedure,
                OPERATION_HASH: operationHash,
                ...(dependency.domain && { DOMAIN: dependency.domain }),
                ...(dependency.service && { SERVICE: dependency.service }),
                CONTEXT: dependency.contxt,
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
            ...(dependency.domain ? [dependency.domain] : []),
            ...(dependency.service ? [dependency.service] : []),
            dependency.context,
            dependency.procedure
          );

          const key = `${dependency.name}${
            dependency.domain ? `-${dependency.domain}` : ""
          }${dependency.service ? `-${dependency.service}` : ""}-${
            config.context
          }`;

          services = {
            ...services,
            [key]: {
              ...common,
              image: `${commonServiceImagePrefix}.${dependency.context}${
                dependency.domain ? `.${dependency.domain}` : ""
              }${dependency.service ? `.${dependency.service}` : ""}.${
                dependency.name
              }:latest`,
              container_name: `${operationHash}.${network}`,
              environment: {
                ...commonEnvironment,
                PROCEDURE: dependency.procedure,
                OPERATION_HASH: operationHash,
                ...(dependency.domain && { DOMAIN: dependency.domain }),
                ...(dependency.service && { SERVICE: dependency.service }),
                CONTEXT: dependency.contxt,
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
                ...(twilioTestReceivingPhoneNumber && {
                  TWILIO_TEST_RECEIVING_PHONE_NUMBER: twilioTestReceivingPhoneNumber,
                }),
                ...(twilioSendingPhoneNumber && {
                  TWILIO_SENDING_PHONE_NUMBER: twilioSendingPhoneNumber,
                }),
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
            adminUser: mongodbAdminUser,
            adminUserPassword: mongodbAdminUserPassword,
            adminDatabase: mongodbAdminDatabase,
            database: mongodbDatabase,
            user: mongodbUser,
            userPassword: mongodbUserPassword,
          }),
        }
      : []),
  };
};
