import { oneLine } from "common-tags";

export default ({ name, maxDispatchPerSecond, maxConcurrentDispatches }) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
    gcloud tasks queues update ${name}
    --location=us-central1
    --max-dispatches-per-second=${maxDispatchPerSecond}
    --max-concurrent-dispatches=${maxConcurrentDispatches}
    --max-concurrent-dispatches=100 || exit 0
    `,
    ],
  };
};
