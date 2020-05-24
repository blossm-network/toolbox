module.exports = ({
  procedure,
  operationHash,
  port,
  publicKeyUrl,
  mainContainerName,
  network,
  context,
  host,
  service,
  project,
  region,
  coreNetwork,
  containerRegistery,
  dependencyKeyEnvironmentVariables,
  domain,
  name,
  store,
  env,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  mongodbUser,
  mongodbUserPassword,
  mongodbHost,
  mongodbDatabase,
  mongodbProtocol,
  envVars,
}) => {
  const common = {
    container_name: mainContainerName,
    ports: [`${port}`],
    environment: {
      PORT: `${port}`,
      NODE_ENV: env,
      ...(domain && { DOMAIN: domain }),
      ...(service && { SERVICE: service }),
      NETWORK: network,
      CORE_NETWORK: coreNetwork,
      HOST: host,
      PROCEDURE: procedure,
      OPERATION_HASH: operationHash,
      ...dependencyKeyEnvironmentVariables,
      GCP_PROJECT: project,
      GCP_REGION: region,
      GCP_SECRET_BUCKET: secretBucket,
      GCP_KMS_SECRET_BUCKET_KEY_LOCATION: secretBucketKeyLocation,
      GCP_KMS_SECRET_BUCKET_KEY_RING: secretBucketKeyRing,
      ...envVars,
    },
  };

  const commonDatabaseEnv = {
    MONGODB_USER: mongodbUser,
    MONGODB_HOST: mongodbHost,
    MONGODB_USER_PASSWORD: mongodbUserPassword,
    MONGODB_DATABASE: mongodbDatabase,
    MONGODB_PROTOCOL: mongodbProtocol,
  };

  const commonImagePrefix = `${containerRegistery}/${procedure}`;

  switch (procedure) {
    case "view-store":
      return {
        image: `${commonImagePrefix}.${context}${service ? `.${service}` : ""}${
          domain ? `.${domain}` : ""
        }.${name}:latest`,
        ...common,
        environment: {
          NAME: name,
          CONTEXT: context,
          ...common.environment,
          ...commonDatabaseEnv,
        },
      };
    case "view-composite":
      return {
        image: `${commonImagePrefix}.${context}${service ? `.${service}` : ""}${
          domain ? `.${domain}` : ""
        }.${name}:latest`,
        ...common,
        environment: {
          NAME: name,
          CONTEXT: context,
          ...common.environment,
        },
      };
    case "event-store":
      return {
        image: `${commonImagePrefix}.${service}.${domain}:latest`,
        ...common,
        environment: {
          ...common.environment,
          ...commonDatabaseEnv,
        },
      };
    case "command":
      return {
        image: `${commonImagePrefix}.${service}.${domain}.${name}:latest`,
        ...common,
        environment: {
          ...common.environment,
          NAME: name,
        },
      };
    case "event-handler":
    case "projection":
      return {
        image: `${commonImagePrefix}.${context}${service ? `.${service}` : ""}${
          domain ? `.${domain}` : ""
        }.${name}.${store.domain}.${store.service}:latest`,
        ...common,
        environment: {
          ...common.environment,
          ...commonDatabaseEnv,
          NAME: name,
          CONTEXT: context,
          STORE_DOMAIN: store.domain,
          STORE_SERVICE: store.service,
        },
      };
    case "job":
    case "fact":
      return {
        image: `${commonImagePrefix}${service ? `.${service}` : ""}${
          domain ? `.${domain}` : ""
        }.${name}:latest`,
        ...common,
        environment: {
          ...common.environment,
          NAME: name,
        },
      };
    case "command-gateway":
      return {
        image: `${commonImagePrefix}.${service}.${domain}:latest`,
        ...common,
        environment: {
          ...common.environment,
          PUBLIC_KEY_URL: publicKeyUrl,
        },
      };
    case "view-gateway":
      return {
        image: `${commonImagePrefix}.${context}${service ? `.${service}` : ""}${
          domain ? `.${domain}` : ""
        }:latest`,
        ...common,
        environment: {
          ...common.environment,
          CONTEXT: context,
          PUBLIC_KEY_URL: publicKeyUrl,
        },
      };
    case "fact-gateway":
      return {
        image: `${commonImagePrefix}${service ? `.${service}` : ""}${
          domain ? `.${domain}` : ""
        }:latest`,
        ...common,
        environment: {
          ...common.environment,
          PUBLIC_KEY_URL: publicKeyUrl,
        },
      };
  }
};
