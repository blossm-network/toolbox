import ensureResource from "./ensure_resource.js";

export default ({ name, ring, project, next, rotation }) =>
  ensureResource({
    describe: [
      "kms",
      "keys",
      "describe",
      name,
      `--keyring=${ring}`,
      "--location=global",
      `--project=${project}`,
    ],
    create: [
      "kms",
      "keys",
      "create",
      name,
      `--keyring=${ring}`,
      "--location=global",
      `--project=${project}`,
      "--purpose=encryption",
      `--rotation-period=${rotation}`,
      `--next-rotation-time=${next}`,
      "--quiet",
    ],
  });
