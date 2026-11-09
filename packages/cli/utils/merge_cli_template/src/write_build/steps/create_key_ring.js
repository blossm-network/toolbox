import ensureResource from "./ensure_resource.js";

export default ({ name, location, project }) =>
  ensureResource({
    describe: [
      "kms",
      "keyrings",
      "describe",
      name,
      `--location=${location}`,
      `--project=${project}`,
    ],
    create: [
      "kms",
      "keyrings",
      "create",
      name,
      `--location=${location}`,
      `--project=${project}`,
      "--quiet",
    ],
  });
