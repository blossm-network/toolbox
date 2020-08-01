const { oneLine } = require("common-tags");

module.exports = ({ name, maxDispatchPerSecond }) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
    gcloud tasks queues update ${name}
    --max-dispatches-per-second=${maxDispatchPerSecond}
    --max-concurrent-dispatches=100 || exit 0
    `,
    ],
  };
};
