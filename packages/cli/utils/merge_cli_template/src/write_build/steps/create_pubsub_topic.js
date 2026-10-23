import ensureResource from "./ensure_resource.js";

export default ({ action, domain, service, project }) =>
  ensureResource({
    describe: [
      "pubsub",
      "topics",
      "describe",
      `${action}.${domain}.${service}`,
      `--project=${project}`,
    ],
    create: [
      "pubsub",
      "topics",
      "create",
      `${action}.${domain}.${service}`,
      `--project=${project}`,
      "--quiet",
    ],
  });
