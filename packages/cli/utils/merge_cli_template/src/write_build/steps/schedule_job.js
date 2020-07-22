const { oneLine } = require("common-tags");
module.exports = ({
  name,
  schedule,
  uri,
  region,
  serviceName,
  operationHash,
  computeUrlId,
  project,
}) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
      gcloud beta scheduler jobs create http ${name}
      --schedule="${schedule}"
      --uri=https://${uri},
      --oidc-service-account-email=executer@${project}.iam.gserviceaccount.com
      --oidc-token-audience=https://${serviceName}-${computeUrlId}-uc.a.run.app,
      --project=${project} || exit 0
      `,
    ],
  };
};
