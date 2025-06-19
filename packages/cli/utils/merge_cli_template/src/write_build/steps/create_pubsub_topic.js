import { oneLine } from "common-tags";

export default ({ action, domain, service, project }) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
    gcloud pubsub topics create ${action}.${domain}.${service}
    --project=${project} || exit 0
    `,
    ],
  };
};
