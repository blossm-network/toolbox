const { stripIndents } = require("common-tags");

module.exports = ({
  mainContainerName,
  procedure,
  operationHash,
  serviceName,
  localNetwork,
  localBaseNetwork,
  project,
  region,
  secretBucket,
  secretBucketKeyRing,
  secretBucketKeyLocation,
  custom = {},
} = {}) => {
  return {
    name: "node:20.19.0",
    entrypoint: "bash",
    args: [
      "-c",
      stripIndents`
    cat >> .env <<- EOM
    ${Object.entries({
      NETWORK: localNetwork,
      HOST: localNetwork,
      NODE_ENV: "local",
      BASE_NETWORK: localBaseNetwork,
      PROCEDURE: procedure,
      OPERATION_HASH: operationHash,
      SERVICE_NAME: serviceName,
      MAIN_CONTAINER_NAME: mainContainerName,
      GCP_PROJECT: project,
      GCP_REGION: region,
      GCP_SECRET_BUCKET: secretBucket,
      GCP_KMS_SECRET_BUCKET_KEY_RING: secretBucketKeyRing,
      GCP_KMS_SECRET_BUCKET_KEY_LOCATION: secretBucketKeyLocation,
      ...custom,
    }).reduce((string, [key, value]) => (string += `${key}=${value}\n`), "")}
    EOM`,
    ],
  };
};
