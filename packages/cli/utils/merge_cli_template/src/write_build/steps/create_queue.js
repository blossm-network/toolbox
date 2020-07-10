const { oneLine } = require("common-tags");

module.exports = ({ name, project }) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
    gcloud tasks queues create ${name}
    --log-sampling-ratio=0.1
    --project=${project} 
    --quiet || exit 0
    `,
    ],
  };
};
