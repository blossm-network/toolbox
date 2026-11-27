import ensureDnsRecord from "./ensure_dns_record.js";
import ensureResource from "./ensure_resource.js";

// Puts a gateway behind the environment's shared load balancer, so every
// request passes the Cloud Armor policy before it reaches the service.
//
// The operator creates the shared parts once: the address, the security
// policy, the url map, the certificate map and the proxy that joins them.
// This adds the gateway's own parts, each named after its service, and is
// safe to repeat.
//
// The order is the guarantee: the backend carries the policy before any
// hostname routes to it.
export default ({
  uri,
  dnsZone,
  project,
  region,
  serviceName,
  loadBalancer: { urlMap, certificateMap, securityPolicy, address },
}) => {
  const scope = [`--project=${project}`];
  const write = [...scope, "--quiet"];
  const backend = ["compute", "backend-services"];
  const group = ["compute", "network-endpoint-groups"];
  const certificate = ["certificate-manager", "certificates"];
  const entry = ["certificate-manager", "maps", "entries"];
  return [
    ensureResource({
      describe: [
        ...group,
        "describe",
        serviceName,
        `--region=${region}`,
        ...scope,
        "--format=value(cloudRun.service)",
      ],
      create: [
        ...group,
        "create",
        serviceName,
        `--region=${region}`,
        "--network-endpoint-type=serverless",
        `--cloud-run-service=${serviceName}`,
        ...write,
      ],
      expected: serviceName,
    }),
    ensureResource({
      describe: [...backend, "describe", serviceName, "--global", ...scope],
      create: [
        ...backend,
        "create",
        serviceName,
        "--global",
        "--load-balancing-scheme=EXTERNAL_MANAGED",
        ...write,
      ],
    }),
    // Every build, not only the first: a backend never stays without it.
    {
      name: "gcr.io/cloud-builders/gcloud",
      args: [
        ...backend,
        "update",
        serviceName,
        "--global",
        `--security-policy=${securityPolicy}`,
        ...write,
      ],
    },
    ensureResource({
      describe: [
        ...backend,
        "describe",
        serviceName,
        "--global",
        ...scope,
        "--format=value(backends[].group)",
      ],
      create: [
        ...backend,
        "add-backend",
        serviceName,
        "--global",
        `--network-endpoint-group=${serviceName}`,
        `--network-endpoint-group-region=${region}`,
        ...write,
      ],
      emptyIsMissing: true,
    }),
    ensureResource({
      describe: [
        ...certificate,
        "describe",
        serviceName,
        ...scope,
        "--format=value(managed.domains)",
      ],
      create: [
        ...certificate,
        "create",
        serviceName,
        `--domains=${uri}`,
        ...write,
      ],
      expected: uri,
    }),
    ensureResource({
      describe: [
        ...entry,
        "describe",
        serviceName,
        `--map=${certificateMap}`,
        ...scope,
        "--format=value(hostname)",
      ],
      create: [
        ...entry,
        "create",
        serviceName,
        `--map=${certificateMap}`,
        `--certificates=${serviceName}`,
        `--hostname=${uri}`,
        ...write,
      ],
      expected: uri,
    }),
    // The url map is shared, so the gateway's own matcher is looked for by
    // name among the map's matchers. Two gateway builds editing the map at
    // once can collide; the loser fails and is safe to run again.
    ensureResource({
      describe: [
        "compute",
        "url-maps",
        "describe",
        urlMap,
        "--global",
        ...scope,
        "--format=value(pathMatchers[].name)",
      ],
      create: [
        "compute",
        "url-maps",
        "add-path-matcher",
        urlMap,
        "--global",
        `--path-matcher-name=${serviceName}`,
        `--default-service=${serviceName}`,
        `--new-hosts=${uri}`,
        ...write,
      ],
      has: serviceName,
    }),
    ensureDnsRecord({ uri, dnsZone, project, type: "A", data: address }),
  ];
};
