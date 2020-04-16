module.exports = ({ uri, dnsZone, project }) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    args: [
      "beta",
      "dns",
      "record-sets",
      "transaction",
      "add",
      "ghs.googlehosted.com.",
      `--name=${uri}`,
      `--zone=${dnsZone}`,
      "--type=CNAME",
      "--ttl=86400",
      `--project=${project}`,
    ],
  };
};
