const { stripIndents } = require("common-tags");

module.exports = ({
  mainContainerName,
  procedure,
  project,
  region,
  secretBucket,
  secretBucketKeyRing,
  secretBucketKeyLocation,
  custom = {}
} = {}) => {
  return {
    name: "node:10.16.0",
    entrypoint: "bash",
    args: [
      "-c",
      stripIndents`
    cat >> .env <<- EOM
    NETWORK=local.network
    HOST=local.network
    NODE_ENV=local
    PROCEDURE=${procedure}
    MAIN_CONTAINER_NAME=${mainContainerName}
    GCP_PROJECT=${project}
    GCP_REGION=${region}
    GCP_SECRET_BUCKET=${secretBucket}
    GCP_KMS_SECRET_BUCKET_KEY_RING=${secretBucketKeyRing}
    GCP_KMS_SECRET_BUCKET_KEY_LOCATION=${secretBucketKeyLocation}
    ${Object.entries(custom).reduce(
      (string, [key, value]) => (string += `${key}=${value}\n`),
      ""
    )}
    EOM`
    ]
  };
};
