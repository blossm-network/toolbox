import { oneLine } from "common-tags";

export default ({ dnsZone, project }) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
    gcloud beta dns record-sets transaction abort
    --zone=${dnsZone}
    --project=${project} || exit 0
    `,
    ],
  };
};
