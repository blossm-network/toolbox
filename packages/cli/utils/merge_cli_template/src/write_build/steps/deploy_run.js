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
  // Omitted options keep the historical connector and internal ingress.
  // An explicit null connector clears any connector a previous revision
  // attached, because Cloud Run otherwise preserves it across deploys.
  cloudRun: {
    serviceAccount,
    vpcConnector = `${region}-network`,
    ingress = "internal",
    maxInstances,
    minInstances,
  } = {},
  cloudSqlInstance,
  secrets = {},
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
        "run",
        "deploy",
        `${serviceName}`,
        `--image=${containerRegistery}/${procedure}${
          extension ? `.${extension}` : ""
        }`,
        "--platform=managed",
        `--memory=${memory}`,
        `--timeout=${timeout}`,
        ...(vpcConnector
          ? [`--vpc-connector=${vpcConnector}`, `--vpc-egress=all`]
          : ["--clear-vpc-connector"]),
        // Reachable ingress is never public access: internal services always
        // require an authenticated invoker.
        allowUnauthenticated
          ? "--allow-unauthenticated"
          : "--no-allow-unauthenticated",
        `--ingress=${allowUnauthenticated ? "all" : ingress}`,
        ...(serviceAccount ? [`--service-account=${serviceAccount}`] : []),
        ...(maxInstances == undefined
          ? []
          : [`--max-instances=${maxInstances}`]),
        ...(minInstances == undefined
          ? []
          : [`--min-instances=${minInstances}`]),
        ...(cloudSqlInstance
          ? [`--add-cloudsql-instances=${cloudSqlInstance}`]
          : []),
        // Secret values are bound by Cloud Run, never written to the build.
        ...(Object.keys(secrets).length
          ? [
              `--set-secrets=${Object.entries(secrets)
                .map(([key, value]) => `${key}=${value}`)
                .join(",")}`,
            ]
          : []),
        `--project=${project}`,
        `--region=${region}`,
        "--env-vars-file=.blossm-cloud-run-env.json",
        `--labels=${Object.entries({
          procedure,
          hash: operationHash,
          ...labels,
        }).reduce((string, [key, value]) => (string += `${key}=${value},`), "")}`,
      ],
    },
  ];
};
