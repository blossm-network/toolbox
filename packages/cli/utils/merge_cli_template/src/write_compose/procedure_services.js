const hash = require("@blossm/service-hash");

const databaseService = require("./database_service");

module.exports = ({
  config,
  databaseServiceKey,
  project,
  port,
  env,
  network,
  service,
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
  mongodbUserPassword
}) => {
  const common = {
    ports: [`${port}`]
  };
  const commonEnvironment = {
    PORT: `${port}`,
    NODE_ENV: `${env}`,
    NETWORK: `${network}`,
    SERVICE: `${service}`,
    GCP_PROJECT: `${project}-staging`,
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
  for (const procedure of config.testing.procedures) {
    const commonServiceImagePrefix = `${containerRegistery}/${service}.${procedure.context}`;
    switch (procedure.context) {
      case "view-store":
        {
          const procedureHash = hash({
            procedure: [procedure.name, procedure.domain, procedure.context],
            service: config.service
          });

          const key = `${procedure.name}-${procedure.domain}-${config.service}`;
          services = {
            ...services,
            [key]: {
              ...common,
              image: `${commonServiceImagePrefix}.${procedure.domain}.${procedure.name}:latest`,
              container_name: `${procedureHash}.${network}`,
              depends_on: [databaseServiceKey],
              environment: {
                ...commonEnvironment,
                ...commonStoreEnvironment,
                CONTEXT: procedure.context,
                DOMAIN: procedure.domain,
                NAME: procedure.name
              }
            }
          };
          includeDatabase = true;
        }
        break;
      case "event-store":
        {
          const procedureHash = hash({
            procedure: [procedure.domain, procedure.context],
            service: config.service
          });

          const key = `${procedure.domain}-${config.service}`;
          services = {
            ...services,
            [key]: {
              ...common,
              image: `${commonServiceImagePrefix}.${procedure.domain}:latest`,
              container_name: `${procedureHash}.${network}`,
              depends_on: [databaseServiceKey],
              environment: {
                ...commonEnvironment,
                ...commonStoreEnvironment,
                CONTEXT: procedure.context,
                DOMAIN: procedure.domain
              }
            }
          };
          includeDatabase = true;
        }
        break;
      case "command-handler":
        {
          const procedureHash = hash({
            procedure: [procedure.name, procedure.domain, procedure.context],
            service: config.service
          });
          const key = `${procedure.name}-${procedure.domain}-${config.service}`;
          services = {
            ...services,
            [key]: {
              ...common,
              image: `${commonServiceImagePrefix}.${procedure.domain}.${procedure.name}:latest`,
              container_name: `${procedureHash}.${network}`,
              environment: {
                ...commonEnvironment,
                CONTEXT: procedure.context,
                DOMAIN: procedure.domain,
                NAME: procedure.name
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
