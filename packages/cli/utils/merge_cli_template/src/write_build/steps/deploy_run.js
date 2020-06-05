module.exports = ({
  region,
  project,
  network,
  procedure,
  memory,
  timeout,
  coreNetwork,
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
  allowUnauthenticated = false,
} = {}) => {
  //TODO
  //eslint-disable-next-line no-console
  console.log({
    coreNetwork,
    network,
  });

  return {
    name: "gcr.io/cloud-builders/gcloud",
    args: [
      "alpha",
      "run",
      "deploy",
      `${serviceName}`,
      `--image=${containerRegistery}/${procedure}${
        extension ? `.${extension}` : ""
      }`,
      "--platform=managed",
      `--memory=${memory}`,
      `--timeout=${timeout}`,
      `--vpc-connector=${region}-network`,
      ...(allowUnauthenticated ? ["--allow-unauthenticated"] : []),
      `--project=${project}`,
      `--region=${region}`,
      `--set-env-vars=${Object.entries({
        NODE_ENV: nodeEnv,
        NETWORK: `${envUriSpecifier}${network}`,
        CORE_NETWORK:
          coreNetwork == network
            ? `${envUriSpecifier}${coreNetwork}`
            : nodeEnv == "production"
            ? coreNetwork
            : //TODO
              // : `snd.${coreNetwork}`,
              `dev.${coreNetwork}`,
        HOST: `${region}.${envUriSpecifier}${network}`,
        PROCEDURE: procedure,
        OPERATION_HASH: operationHash,
        GCP_PROJECT: project,
        GCP_REGION: region,
        GCP_SECRET_BUCKET: secretBucket,
        GCP_ROLES_BUCKET: rolesBucket,
        GCP_KMS_SECRET_BUCKET_KEY_LOCATION: secretBucketKeyLocation,
        GCP_KMS_SECRET_BUCKET_KEY_RING: secretBucketKeyRing,
        GCP_COMPUTE_URL_ID: computeUrlId,
        ...env,
      }).reduce((string, [key, value]) => (string += `${key}=${value},`), "")}`,
      `--labels=${Object.entries({
        procedure,
        hash: operationHash,
        ...labels,
      }).reduce((string, [key, value]) => (string += `${key}=${value},`), "")}`,
    ],
  };
};
