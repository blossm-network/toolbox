import ensureResource from "./ensure_resource.js";

export default ({ name, ring, location, project }) =>
  ensureResource({
    describe: [
      "kms",
      "keys",
      "describe",
      name,
      `--keyring=${ring}`,
      `--location=${location}`,
      `--project=${project}`,
    ],
    create: [
      "kms",
      "keys",
      "create",
      name,
      `--keyring=${ring}`,
      `--location=${location}`,
      `--project=${project}`,
      "--purpose=asymmetric-signing",
      "--default-algorithm=ec-sign-p256-sha256",
      "--quiet",
    ],
  });
