module.exports = ({
  region,
  operationName,
  operationHash,
  project,
  envNameSpecifier
}) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    args: [
      "beta",
      "run",
      "services",
      "add-iam-policy-binding",
      `${region}-${operationName}-${operationHash}`,
      `--member=serviceAccount:cloud-run-pubsub-invoker@${project}${envNameSpecifier}.iam.gserviceaccount.com`,
      "--role=roles/run.invoker",
      "--project=${_GCP_PROJECT}${_ENV_NAME_SPECIFIER}",
      "--region=${_GCP_REGION}"
    ]
  };
};
