import writeEnv from "./write_env.js";

export default ({
  region,
  project,
  network,
  host,
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
  redisHost,
  redisPort,
  extension,
  nodeEnv,
  env = "",
  labels = "",
  allowUnauthenticated = false,
} = {}) => {
  const variables = {
    NODE_ENV: nodeEnv,
    NETWORK: `${envUriSpecifier}${network}`,
    CORE_NETWORK: coreNetwork,
    HOST: host,
    PROCEDURE: procedure,
    OPERATION_HASH: operationHash,
    SERVICE_NAME: serviceName,
    GCP_PROJECT: project,
    GCP_REGION: region,
    ...(redisHost && { REDIS_HOST: redisHost }),
    ...(redisPort && { REDIS_PORT: redisPort }),
    GCP_SECRET_BUCKET: secretBucket,
    GCP_ROLES_BUCKET: rolesBucket,
    GCP_KMS_SECRET_BUCKET_KEY_LOCATION: secretBucketKeyLocation,
    GCP_KMS_SECRET_BUCKET_KEY_RING: secretBucketKeyRing,
    GCP_COMPUTE_URL_ID: computeUrlId,
    ...env,
  };
  return [
    writeEnv({ custom: variables, format: "json" }),
    {
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
        `--vpc-egress=all`,
        ...(allowUnauthenticated ? ["--allow-unauthenticated"] : []),
        `--ingress=${allowUnauthenticated ? "all" : "internal"}`,
        `--project=${project}`,
        `--region=${region}`,
        "--env-vars-file=.blossm-cloud-run-env.json",
        `--labels=${Object.entries({
          procedure,
          hash: operationHash,
          ...labels,
        })
          .map(([key, value]) => `${key}=${value}`)
          .join(",")}`,
      ],
    },
  ];
};
