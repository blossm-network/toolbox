export default ({
  name,
  project,
  maxDispatchPerSecond,
  maxConcurrentDispatches,
}) => ({
  name: "gcr.io/cloud-builders/gcloud",
  entrypoint: "gcloud",
  args: [
    "tasks",
    "queues",
    "update",
    name,
    "--location=us-central1",
    `--max-dispatches-per-second=${maxDispatchPerSecond}`,
    `--max-concurrent-dispatches=${maxConcurrentDispatches}`,
    `--project=${project}`,
    "--quiet",
  ],
});
