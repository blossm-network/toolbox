const { oneLine } = require("common-tags");

module.exports = ({ dnsZone, project }) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
    gcloud beta dns record-sets transaction execute
    --zone=${dnsZone}
    --project=${project} || exit 0
    `,
    ],
  };
};
