const { stripIndents } = require("common-tags");

module.exports = ({
  containerRegistery,
  mainContainerName,
  service,
  context,
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
    NETWORK=local
    SERVICE=${service}
    CONTEXT=${context}
    MAIN_CONTAINER_NAME=${mainContainerName}
    CONTAINER_REGISTRY=${containerRegistery}
    GCP_PROJECT=${project}-staging
    GCP_REGION=${region}
    GCP_SECRET_BUCKET=${secretBucket}
    GCP_KMS_SECRET_BUCKET_KEY_RING=${secretBucketKeyRing}
    GCP_KMS_SECRET_BUCKET_KEY_LOCATION=${secretBucketKeyLocation}
    ${Object.entries(custom).map(([key, value]) => `${key}=${value}\n`)}
    EOM`
    ]
  };
};
