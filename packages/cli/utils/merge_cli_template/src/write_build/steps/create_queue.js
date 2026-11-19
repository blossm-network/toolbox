import ensureResource from "./ensure_resource.js";

export default ({
  name,
  project,
  region,
  maxDispatchPerSecond,
  maxConcurrentDispatches,
}) =>
  ensureResource({
    describe: [
      "tasks",
      "queues",
      "describe",
      name,
      `--location=${region}`,
      `--project=${project}`,
    ],
    create: [
      "tasks",
      "queues",
      "create",
      name,
      `--location=${region}`,
      `--project=${project}`,
      "--log-sampling-ratio=0.1",
      `--max-dispatches-per-second=${maxDispatchPerSecond}`,
      `--max-concurrent-dispatches=${maxConcurrentDispatches}`,
      "--quiet",
    ],
  });
