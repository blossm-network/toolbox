const hash = require("@blossm/operation-hash");

const databaseService = require("./database_service");

module.exports = ({
  config,
  databaseServiceKey,
  project,
  port,
  env,
  network,
  host,
  region,
  containerRegistery,
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
  twilioTestReceivingPhoneNumber
}) => {
  const common = {
    ports: [`${port}`]
  };
  const commonEnvironment = {
    PORT: `${port}`,
    NODE_ENV: `${env}`,
    NETWORK: `${network}`,
    HOST: `${host}`,
    GCP_PROJECT: `${project}`,
    GCP_REGION: `${region}`,
    GCP_SECRET_BUCKET: `${secretBucket}`,
    GCP_KMS_SECRET_BUCKET_KEY_LOCATION: `${secretBucketKeyLocation}`,
    GCP_KMS_SECRET_BUCKET_KEY_RING: `${secretBucketKeyRing}`
  };
  const commonStoreEnvironment = {
    MONGODB_USER: `${mongodbUser}`,
    MONGODB_HOST: `${mongodbHost}`,
    MONGODB_USER_PASSWORD: `${mongodbUserPassword}`,
    MONGODB_PROTOCOL: `${mongodbProtocol}`,
    MONGODB_DATABASE: `${mongodbDatabase}`
  };
  let services = {};
  let includeDatabase = false;
  for (const dependency of config.testing.dependencies) {
    const commonServiceImagePrefix = `${containerRegistery}/${dependency.procedure}`;
    switch (dependency.procedure) {
      case "view-store":
        {
          const operationHash = hash(
            dependency.name,
            dependency.domain,
            dependency.service,
            dependency.procedure
          );

          const key = `${dependency.name}-${dependency.domain}-${config.service}`;
          services = {
            ...services,
            [key]: {
              ...common,
              image: `${commonServiceImagePrefix}.${dependency.service}.${dependency.domain}.${dependency.name}:latest`,
              container_name: `${operationHash}.${network}`,
              depends_on: [databaseServiceKey],
              environment: {
                ...commonEnvironment,
                ...commonStoreEnvironment,
                PROCEDURE: dependency.procedure,
                OPERATION_HASH: operationHash,
                DOMAIN: dependency.domain,
                SERVICE: dependency.service,
                NAME: dependency.name
              }
            }
          };
          includeDatabase = true;
        }
        break;
      case "event-store":
        {
          const operationHash = hash(
            dependency.domain,
            dependency.service,
            dependency.procedure
          );

          const key = `${dependency.domain}-${config.service}`;
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
                SERVICE: dependency.service
              }
            }
          };
          includeDatabase = true;
        }
        break;
      case "command-handler":
        {
          const operationHash = hash(
            dependency.name,
            dependency.domain,
            dependency.service,
            dependency.procedure
          );
          const key = `${dependency.name}-${dependency.domain}-${config.service}`;
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
                TWILIO_SENDING_PHONE_NUMBER: twilioSendingPhoneNumber,
                TWILIO_RECEIVING_PHONE_NUMBER: twilioTestReceivingPhoneNumber
              }
            }
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
            userPassword: mongodbUserPassword
          })
        }
      : [])
  };
};
