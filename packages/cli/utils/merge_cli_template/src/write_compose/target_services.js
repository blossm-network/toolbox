const hash = require("@blossm/hash-string");

const databaseService = require("./database_service");

module.exports = ({ config, databaseServiceKey }) => {
  const containerRegistry = "us.gcr.io/${GCP_PROJECT}";
  const common = {
    ports: ["${PORT}"]
  };
  const commonEnvironment = {
    PORT: "${PORT}",
    NODE_ENV: "${NODE_ENV}",
    NETWORK: "${NETWORK}",
    SERVICE: "${SERVICE}",
    GCP_PROJECT: "${GCP_PROJECT}",
    GCP_REGION: "${GCP_REGION}",
    GCP_SECRET_BUCKET: "${GCP_SECRET_BUCKET}",
    GCP_KMS_SECRET_BUCKET_KEY_LOCATION: "${GCP_KMS_SECRET_BUCKET_KEY_LOCATION}",
    GCP_KMS_SECRET_BUCKET_KEY_RING: "${GCP_KMS_SECRET_BUCKET_KEY_RING}"
  };
  const commonStoreEnvironment = {
    MONGODB_USER: "${MONGODB_USER}",
    MONGODB_HOST: "${MONGODB_HOST}"
  };
  let services = {};
  let includeDatabase = false;
  for (const target of config.targets || []) {
    const commonServiceImagePrefix = `${containerRegistry}/\${SERVICE}.${target.context}`;
    switch (target.context) {
      case "view-store":
        {
          const targetHash = hash(target.name + target.domain + target.context + config.service).toString();

          const key = `${target.name}-${target.domain}-${config.service}`;
          services = {
            ...services,
            [key]: {
              ...common,
              image: `${commonServiceImagePrefix}.${target.domain}.${target.name}:latest`,
              container_name: `${targetHash}.\${NETWORK}`,
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
          const targetHash = hash(target.domain + target.context + config.service).toString();

          const key = `${target.domain}-${config.service}`;
          services = {
            ...services,
            [key]: {
              ...common,
              image: `${commonServiceImagePrefix}.${target.domain}:latest`,
              container_name: `${targetHash}.\${NETWORK}`,
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
          const targetHash = hash(target.action + target.domain + target.context + config.service).toString();
          const key = `${target.action}-${target.domain}-${config.service}`;
          services = {
            ...services,
            [key]: {
              ...common,
              image: `${commonServiceImagePrefix}.${target.domain}.${target.action}:latest`,
              container_name: `${targetHash}.\${NETWORK}`,
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

  return { ...services, ...(includeDatabase ? { [databaseServiceKey]: databaseService } : []) };
};
