const { stripIndents } = require("common-tags");

module.exports = ({
  mainContainerName,
  procedure,
  operationHash,
  project,
  region,
  coreNetwork,
  secretBucket,
  secretBucketKeyRing,
  secretBucketKeyLocation,
  custom = {},
} = {}) => {
  return {
    name: "node:10.16.0",
    entrypoint: "bash",
    args: [
      "-c",
      stripIndents`
    cat >> .env <<- EOM
    ${Object.entries({
      NETWORK: "local.network",
      HOST: "local.network",
      NODE_ENV: "local",
      CORE_NETWORK: coreNetwork,
      PROCEDURE: procedure,
      OPERATION_HASH: operationHash,
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
