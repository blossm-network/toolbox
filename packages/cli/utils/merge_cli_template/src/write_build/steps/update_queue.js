export default ({
  name,
  project,
  region,
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
    `--location=${region}`,
    `--max-dispatches-per-second=${maxDispatchPerSecond}`,
    `--max-concurrent-dispatches=${maxConcurrentDispatches}`,
    `--project=${project}`,
    "--quiet",
  ],
});
