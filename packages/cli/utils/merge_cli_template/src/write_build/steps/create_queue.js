import { oneLine } from "common-tags";

export default ({
  name,
  project,
  maxDispatchPerSecond,
  maxConcurrentDispatches,
}) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    entrypoint: "bash",
    args: [
      "-c",
      oneLine`
    gcloud tasks queues create ${name}
    --log-sampling-ratio=0.1
    --location=us-central1
    --max-dispatches-per-second=${maxDispatchPerSecond}
    --max-concurrent-dispatches=${maxConcurrentDispatches}
    --project=${project} 
    --quiet || exit 0
    `,
    ],
  };
};
