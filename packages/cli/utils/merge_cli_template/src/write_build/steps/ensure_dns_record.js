import ensureResource from "./ensure_resource.js";

export default ({ uri, dnsZone, project }) => {
  const name = `${uri.replace(/\.$/, "")}.`;
  return ensureResource({
    describe: [
      "dns",
      "record-sets",
      "describe",
      name,
      `--zone=${dnsZone}`,
      "--type=CNAME",
      `--project=${project}`,
      "--format=value(rrdatas)",
    ],
    create: [
      "dns",
      "record-sets",
      "create",
      name,
      `--zone=${dnsZone}`,
      "--type=CNAME",
      "--ttl=86400",
      "--rrdatas=ghs.googlehosted.com.",
      `--project=${project}`,
      "--quiet",
    ],
    expected: "ghs.googlehosted.com.",
  });
};
