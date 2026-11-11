import ensureResource from "./ensure_resource.js";

// Verify configured service ownership; provisioning readiness is separate.
export default ({ serviceName, uri, project, region }) =>
  ensureResource({
    describe: [
      "beta",
      "run",
      "domain-mappings",
      "describe",
      "--platform=managed",
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
      "--platform=managed",
      `--service=${serviceName}`,
      `--domain=${uri}`,
      `--project=${project}`,
      `--region=${region}`,
      "--quiet",
    ],
    expected: serviceName,
  });
