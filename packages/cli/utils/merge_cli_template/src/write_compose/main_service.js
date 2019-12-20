module.exports = ({
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
  env,
  action,
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
      NETWORK: `${network}`,
      CONTEXT: `${context}`,
      SERVICE: `${service}`,
      GCP_PROJECT: `${project}-staging`,
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

  const commonImagePrefix = `${containerRegistery}/${service}.${context}`;

  switch (context) {
    case "view-store":
      return {
        image: `${commonImagePrefix}.${domain}.${name}:latest`,
        ...common,
        environment: {
          NAME: `${name}`,
          DOMAIN: `${domain}`,
          ...common.environment,
          ...commonDatabaseEnv
        }
      };
    case "event-store":
      return {
        image: `${commonImagePrefix}.${domain}:latest`,
        ...common,
        environment: {
          DOMAIN: `${domain}`,
          ...common.environment,
          ...commonDatabaseEnv
        }
      };
    case "command-handler":
      return {
        image: `${commonImagePrefix}.${domain}.${action}:latest`,
        ...common,
        environment: {
          ...common.environment,
          DOMAIN: `${domain}`,
          ACTION: `${action}`
        }
      };
    case "event-handler":
      return {
        image: `${commonImagePrefix}.${domain}.did-${action}.${name}:latest`,
        ...common,
        environment: {
          ...common.environment,
          DOMAIN: `${domain}`,
          ACTION: `${action}`,
          NAME: `${name}`
        }
      };
    case "job":
      return {
        image: `${commonImagePrefix}.\${DOMAIN}.\${NAME}:latest`,
        ...common,
        environment: {
          ...common.environment,
          DOMAIN: `${domain}`,
          NAME: `${name}`
        }
      };
    case "auth-gateway":
      return {
        image: `${commonImagePrefix}:latest`,
        ...common
      };
  }
};
