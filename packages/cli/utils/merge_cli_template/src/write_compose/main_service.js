module.exports = ({
  procedure,
  port,
  mainContainerName,
  network,
  service,
  project,
  region,
  containerRegistery,
  domain,
  name,
  event,
  env,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  mongodbUser,
  mongodbUserPassword,
  mongodbHost,
  mongodbDatabase,
  mongodbProtocol
}) => {
  const common = {
    container_name: `${mainContainerName}`,
    ports: [`${port}`],
    environment: {
      PORT: `${port}`,
      NODE_ENV: `${env}`,
      DOMAIN: `${domain}`,
      NETWORK: `${network}`,
      PROCEDURE: `${procedure}`,
      SERVICE: `${service}`,
      GCP_PROJECT: `${project}`,
      GCP_REGION: `${region}`,
      GCP_SECRET_BUCKET: `${secretBucket}`,
      GCP_KMS_SECRET_BUCKET_KEY_LOCATION: `${secretBucketKeyLocation}`,
      GCP_KMS_SECRET_BUCKET_KEY_RING: `${secretBucketKeyRing}`
    }
  };

  const commonDatabaseEnv = {
    MONGODB_USER: `${mongodbUser}`,
    MONGODB_HOST: `${mongodbHost}`,
    MONGODB_USER_PASSWORD: `${mongodbUserPassword}`,
    MONGODB_DATABASE: `${mongodbDatabase}`,
    MONGODB_PROTOCOL: `${mongodbProtocol}`
  };

  const commonImagePrefix = `${containerRegistery}/${service}.${procedure}.${domain}`;

  switch (procedure) {
    case "view-store":
      return {
        image: `${commonImagePrefix}.${name}:latest`,
        ...common,
        environment: {
          NAME: `${name}`,
          ...common.environment,
          ...commonDatabaseEnv
        }
      };
    case "event-store":
      return {
        image: `${commonImagePrefix}:latest`,
        ...common,
        environment: {
          ...common.environment,
          ...commonDatabaseEnv
        }
      };
    case "command-handler":
      return {
        image: `${commonImagePrefix}.${name}:latest`,
        ...common,
        environment: {
          ...common.environment,
          NAME: `${name}`
        }
      };
    case "event-handler":
    case "projection":
      return {
        image: `${commonImagePrefix}.${name}.did-${event.action}.${event.domain}:latest`,
        ...common,
        environment: {
          ...common.environment,
          NAME: `${name}`,
          EVENT_ACTION: `${event.action}`,
          EVENT_DOMAIN: `${event.domain}`,
          EVENT_SERVICE: `${event.service}`
        }
      };
    case "job":
      return {
        image: `${commonImagePrefix}.${name}:latest`,
        ...common,
        environment: {
          ...common.environment,
          NAME: `${name}`
        }
      };
    case "command-gateway":
    case "view-gateway":
      return {
        image: `${commonImagePrefix}:latest`,
        ...common
      };
  }
};
