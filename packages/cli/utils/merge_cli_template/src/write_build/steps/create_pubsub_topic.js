const { oneLine } = require("common-tags");

module.exports = ({ action, domain, service, project }) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
    gcloud pubsub topics create did-${action}.${domain}.${service}
    --project=${project} || exit 0
    `,
    ],
  };
};
