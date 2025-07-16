import { oneLine } from "common-tags";

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
  return {
    name: "gcr.io/cloud-builders/gcloud",
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
      gcloud beta scheduler jobs create http ${name}
      --schedule="${schedule}"
      --uri=https://${uri}
      --http-method=${method}
      --oidc-service-account-email=executer@${project}.iam.gserviceaccount.com
      --oidc-token-audience=https://${serviceName}-${computeUrlId}.${region}.a.run.app
      --project=${project} 
      --quiet || exit 0
      `,
    ],
  };
};
