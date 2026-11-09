import { nodeImage } from "../../../runtime.js";

export default ({
  mainContainerName,
  procedure,
  operationHash,
  serviceName,
  localNetwork,
  localCoreNetwork,
  project,
  region,
  secretBucket,
  secretBucketKeyRing,
  secretBucketKeyLocation,
  custom = {},
  format = "dotenv",
} = {}) => {
  const values =
    format === "json"
      ? custom
      : {
          NETWORK: localNetwork,
          HOST: localNetwork,
          NODE_ENV: "local",
          CORE_NETWORK: localCoreNetwork,
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
        };
  const filename = format === "json" ? ".blossm-cloud-run-env.json" : ".env";
  const data =
    format === "json"
      ? JSON.stringify(
          Object.fromEntries(
            Object.entries(values).map(([key, value]) => [key, String(value)])
          )
        )
      : Object.entries(values)
          .map(([key, value]) => `${key}=${value}\n`)
          .join("");
  return {
    name: nodeImage,
    entrypoint: "node",
    args: [
      "-e",
      `require('fs').writeFileSync(${JSON.stringify(
        filename
      )}, Buffer.from(process.argv[1], 'base64'))`,
      Buffer.from(data).toString("base64"),
    ],
  };
};
