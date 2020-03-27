module.exports = ({
  region,
  project,
  network,
  procedure,
  memory,
  operationHash,
  containerRegistery,
  envUriSpecifier,
  serviceName,
  rolesBucket,
  secretBucket,
  secretBucketKeyLocation,
  secretBucketKeyRing,
  computeUrlId,
  extension,
  nodeEnv,
  env = "",
  labels = "",
  allowUnauthenticated = false
} = {}) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    args: [
      "beta",
      "run",
      "deploy",
      `${serviceName}`,
      `--image=${containerRegistery}/${procedure}.${extension}`,
      "--platform=managed",
      `--memory=${memory}`,
      ...(allowUnauthenticated ? ["--allow-unauthenticated"] : []),
      `--project=${project}`,
      `--region=${region}`,
      `--set-env-vars=NODE_ENV=${nodeEnv},NETWORK=${envUriSpecifier}${network},HOST=${region}.${envUriSpecifier}${network},PROCEDURE=${procedure},GCP_PROJECT=${project},GCP_REGION=${region},GCP_SECRET_BUCKET=${secretBucket},GCP_ROLES_BUCKET=${rolesBucket},GCP_KMS_SECRET_BUCKET_KEY_LOCATION=${secretBucketKeyLocation},GCP_KMS_SECRET_BUCKET_KEY_RING=${secretBucketKeyRing},GCP_COMPUTE_URL_ID=${computeUrlId},${env}`,
      `--labels=procedure=${procedure},hash=${operationHash},${labels}`
    ]
  };
};
