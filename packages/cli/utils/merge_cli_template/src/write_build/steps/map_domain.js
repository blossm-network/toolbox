import { oneLine } from "common-tags";

export default ({ serviceName, uri, project, region }) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
      gcloud beta run domain-mappings create
      --platform=managed
      --service=${serviceName}
      --domain=${uri}
      --project=${project}
      --region=${region} || exit 0
      `,
    ],
  };
};
