import ensureResource from "./ensure_resource.js";

export default ({ serviceName, uri, project, region }) =>
  ensureResource({
    describe: [
      "beta",
      "run",
      "domain-mappings",
      "describe",
      `--domain=${uri}`,
      `--project=${project}`,
      `--region=${region}`,
      "--format=value(spec.routeName)",
    ],
    create: [
      "beta",
      "run",
      "domain-mappings",
      "create",
      `--service=${serviceName}`,
      `--domain=${uri}`,
      `--project=${project}`,
      `--region=${region}`,
      "--quiet",
    ],
    expected: serviceName,
  });
