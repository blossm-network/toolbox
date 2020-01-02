module.exports = ({ region, serviceName, project, envNameSpecifier }) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    args: [
      "beta",
      "run",
      "services",
      "add-iam-policy-binding",
      `${serviceName}`,
      `--member=serviceAccount:cloud-run-pubsub-invoker@${project}${envNameSpecifier}.iam.gserviceaccount.com`,
      "--platform=managed",
      "--role=roles/run.invoker",
      `--project=${project}${envNameSpecifier}`,
      `--region=${region}`
    ]
  };
};
