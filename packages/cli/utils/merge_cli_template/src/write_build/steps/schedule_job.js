import ensureResource from "./ensure_resource.js";
import runtimeIdentity from "./runtime_identity.js";

export default ({
  name,
  schedule,
  uri,
  region,
  serviceName,
  computeUrlId,
  project,
  cloudRun,
  method = "post",
}) => {
  const options = [
    `--schedule=${schedule}`,
    `--uri=https://${uri}`,
    `--http-method=${method}`,
    // The job calls the service as the service itself.
    `--oidc-service-account-email=${runtimeIdentity(cloudRun)}`,
    `--oidc-token-audience=https://${serviceName}-${computeUrlId}.${region}.run.app`,
    `--project=${project}`,
    `--location=${region}`,
    "--quiet",
  ];
  return ensureResource({
    describe: [
      "scheduler",
      "jobs",
      "describe",
      name,
      `--project=${project}`,
      `--location=${region}`,
    ],
    create: ["scheduler", "jobs", "create", "http", name, ...options],
    update: ["scheduler", "jobs", "update", "http", name, ...options],
  });
};
