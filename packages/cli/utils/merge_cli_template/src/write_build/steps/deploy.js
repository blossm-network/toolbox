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
  allowUnauthenticated = false,
  routerNetwork,
  routerKeyId,
  routerKeySecretName
} = {}) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    args: [
      "beta",
      "run",
      "deploy",
      `${serviceName}`,
      `--image=${containerRegistery}/${procedure}${
        extension ? `.${extension}` : ""
      }`,
      "--platform=managed",
      `--memory=${memory}`,
      ...(allowUnauthenticated ? ["--allow-unauthenticated"] : []),
      `--project=${project}`,
      `--region=${region}`,
      `--set-env-vars=${Object.entries({
        NODE_ENV: nodeEnv,
        NETWORK: `${envUriSpecifier}${network}`,
        HOST: `${region}.${envUriSpecifier}${network}`,
        PROCEDURE: procedure,
        OPERATION_HASH: operationHash,
        ...(routerNetwork && { ROUTER_NETWORK: routerNetwork }),
        ...(routerKeyId && { ROUTER_KEY_ID: routerKeyId }),
        ...(routerKeySecretName && {
          ROUTER_KEY_SECRET_NAME: routerKeySecretName
        }),
        GCP_PROJECT: project,
        GCP_REGION: region,
        GCP_SECRET_BUCKET: secretBucket,
        GCP_ROLES_BUCKET: rolesBucket,
        GCP_KMS_SECRET_BUCKET_KEY_LOCATION: secretBucketKeyLocation,
        GCP_KMS_SECRET_BUCKET_KEY_RING: secretBucketKeyRing,
        GCP_COMPUTE_URL_ID: computeUrlId,
        ...env
      }).reduce((string, [key, value]) => (string += `${key}=${value},`), "")}`,
      `--labels=${Object.entries({
        procedure,
        hash: operationHash,
        ...labels
      }).reduce((string, [key, value]) => (string += `${key}=${value},`), "")}`
    ]
  };
};
