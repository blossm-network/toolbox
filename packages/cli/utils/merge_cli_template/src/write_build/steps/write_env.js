const { stripIndents } = require("common-tags");

module.exports = ({
  mainContainerName,
  domain,
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
    NODE_ENV=local
    DOMAIN=${domain}
    SERVICE=${service}
    CONTEXT=${context}
    MAIN_CONTAINER_NAME=${mainContainerName}
    GCP_PROJECT=${project}-staging
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
