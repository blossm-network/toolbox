module.exports = context => {
  const common = {
    container_name: "${MAIN_CONTAINER_NAME}",
    ports: ["${PORT}"],
    environment: {
      PORT: "${PORT}",
      NODE_ENV: "${NODE_ENV}",
      NETWORK: "${NETWORK}",
      CONTEXT: "${CONTEXT}",
      SERVICE: "${SERVICE}",
      GCP_PROJECT: "${GCP_PROJECT}",
      GCP_REGION: "${GCP_REGION}",
      GCP_SECRET_BUCKET: "${GCP_SECRET_BUCKET}",
      GCP_KMS_SECRET_BUCKET_KEY_LOCATION:
        "${GCP_KMS_SECRET_BUCKET_KEY_LOCATION}",
      GCP_KMS_SECRET_BUCKET_KEY_RING: "${GCP_KMS_SECRET_BUCKET_KEY_RING}"
    }
  };

  const commonDatabaseEnv = {
    MONGODB_USER: "${MONGODB_USER}",
    MONGODB_HOST: "${MONGODB_HOST}",
    MONGODB_USER_PASSWORD: "${MONGODB_USER_PASSWORD}",
    MONGODB_PROTOCOL: "${MONGODB_PROTOCOL}"
  };

  const commonImagePrefix = "${CONTAINER_REGISTRY}/${SERVICE}.${CONTEXT}";

  switch (context) {
    case "view-store":
      return {
        image: `${commonImagePrefix}.\${DOMAIN}.\${NAME}:latest`,
        ...common,
        environment: {
          NAME: "${NAME}",
          DOMAIN: "${DOMAIN}",
          ...common.environment,
          ...commonDatabaseEnv
        }
      };
    case "event-store":
      return {
        image: `${commonImagePrefix}.\${DOMAIN}:latest`,
        ...common,
        environment: {
          DOMAIN: "${DOMAIN}",
          ...common.environment,
          ...commonDatabaseEnv
        }
      };
    case "command-handler":
      return {
        image: `${commonImagePrefix}.\${DOMAIN}.\${ACTION}:latest`,
        ...common,
        environment: {
          ...common.environment,
          DOMAIN: "${DOMAIN}",
          ACTION: "${ACTION}"
        }
      };
    case "event-handler":
      return {
        image: `${commonImagePrefix}.\${DOMAIN}.did-\${ACTION}.\${NAME}:latest`,
        ...common,
        environment: {
          ...common.environment,
          DOMAIN: "${DOMAIN}",
          ACTION: "${ACTION}",
          NAME: "${NAME}"
        }
      };
    case "job":
      return {
        image: `${commonImagePrefix}.\${DOMAIN}.\${NAME}:latest`,
        ...common,
        environment: {
          ...common.environment,
          DOMAIN: "${DOMAIN}",
          NAME: "${NAME}"
        }
      };
    case "auth-gateway":
      return {
        image: `${commonImagePrefix}:latest`,
        ...common
      };
  }
};
