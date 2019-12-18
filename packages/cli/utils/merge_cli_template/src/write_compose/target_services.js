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
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing
}) => {
  const containerRegistry = `us.gcr.io/${project}`;
  const common = {
    ports: [`${port}`]
  };
  const commonEnvironment = {
    PORT: `${port}`,
    NODE_ENV: `${env}`,
    NETWORK: `${network}`,
    SERVICE: `${service}`,
    GCP_PROJECT: `${project}`,
    GCP_REGION: `${region}`,
    GCP_SECRET_BUCKET: `${secretBucket}`,
    GCP_KMS_SECRET_BUCKET_KEY_LOCATION: `${secretBucketKeyLocation}`,
    GCP_KMS_SECRET_BUCKET_KEY_RING: `${secretBucketKeyRing}`
  };
  const commonStoreEnvironment = ({
    user,
    host,
    userPassword,
    protocol,
    database
  }) => {
    return {
      MONGODB_USER: `${user}`,
      MONGODB_HOST: `${host}`,
      MONGODB_USER_PASSWORD: `${userPassword}`,
      MONGODB_PROTOCOL: `${protocol}`,
      MONGODB_DATABASE: `${database}`
    };
  };
  let services = {};
  let includeDatabase = false;
  for (const target of config.targets) {
    const commonServiceImagePrefix = `${containerRegistry}/${service}.${target.context}`;
    switch (target.context) {
      case "view-store":
        {
          const targetHash = hash({
            procedure: [target.name, target.domain, target.context],
            service: config.service
          });

          const key = `${target.name}-${target.domain}-${config.service}`;
          services = {
            ...services,
            [key]: {
              ...common,
              image: `${commonServiceImagePrefix}.${target.domain}.${target.name}:latest`,
              container_name: `${targetHash}.${network}`,
              depends_on: [databaseServiceKey],
              environment: {
                ...commonEnvironment,
                ...commonStoreEnvironment,
                CONTEXT: target.context,
                DOMAIN: target.domain,
                NAME: target.name
              }
            }
          };
          includeDatabase = true;
        }
        break;
      case "event-store":
        {
          const targetHash = hash({
            procedure: [target.domain, target.context],
            service: config.service
          });

          const key = `${target.domain}-${config.service}`;
          services = {
            ...services,
            [key]: {
              ...common,
              image: `${commonServiceImagePrefix}.${target.domain}:latest`,
              container_name: `${targetHash}.${network}`,
              depends_on: [databaseServiceKey],
              environment: {
                ...commonEnvironment,
                ...commonStoreEnvironment,
                CONTEXT: target.context,
                DOMAIN: target.domain
              }
            }
          };
          includeDatabase = true;
        }
        break;
      case "command-handler":
        {
          const targetHash = hash({
            procedure: [target.action, target.domain, target.context],
            service: config.service
          });
          const key = `${target.action}-${target.domain}-${config.service}`;
          services = {
            ...services,
            [key]: {
              ...common,
              image: `${commonServiceImagePrefix}.${target.domain}.${target.action}:latest`,
              container_name: `${targetHash}.${network}`,
              environment: {
                ...commonEnvironment,
                CONTEXT: target.context,
                DOMAIN: target.domain,
                ACTION: target.action
              }
            }
          };
        }
        break;
    }
  }

  return {
    ...services,
    ...(includeDatabase ? { [databaseServiceKey]: databaseService } : [])
  };
};
