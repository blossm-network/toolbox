const { oneLine } = require("common-tags");
module.exports = ({ schedule, serviceName, uri, project, region }) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
      gcloud beta scheduler jobs create http
      --schedule=${schedule}
      --uri=${uri}
      --oidc-service-account-email=executer@${project}.iam.gserviceaccount.com
      --oidc-token-audience=${serviceName}
      --project=${project}
      --region=${region} || exit 0
      `,
    ],
  };
};
