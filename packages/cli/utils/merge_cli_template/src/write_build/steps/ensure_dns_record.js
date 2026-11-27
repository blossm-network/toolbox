import ensureResource from "./ensure_resource.js";

// A gateway mapped by Cloud Run is an alias of Google's front end. One behind a
// load balancer points at that load balancer's address.
export default ({
  uri,
  dnsZone,
  project,
  type = "CNAME",
  data = "ghs.googlehosted.com.",
}) => {
  const name = `${uri.replace(/\.$/, "")}.`;
  return ensureResource({
    describe: [
      "dns",
      "record-sets",
      "describe",
      name,
      `--zone=${dnsZone}`,
      `--type=${type}`,
      `--project=${project}`,
      "--format=value(rrdatas)",
    ],
    create: [
      "dns",
      "record-sets",
      "create",
      name,
      `--zone=${dnsZone}`,
      `--type=${type}`,
      "--ttl=86400",
      `--rrdatas=${data}`,
      `--project=${project}`,
      "--quiet",
    ],
    expected: data,
  });
};
