import ensureResource from "./ensure_resource.js";

export default ({
  name,
  schedule,
  uri,
  region,
  serviceName,
  computeUrlId,
  project,
  method = "post",
}) => {
  const options = [
    `--schedule=${schedule}`,
    `--uri=https://${uri}`,
    `--http-method=${method}`,
    `--oidc-service-account-email=executer@${project}.iam.gserviceaccount.com`,
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
