module.exports = ({ dnsZone }) => {
  return {
    name: "gcr.io/cloud-builders/gcloud",
    args: [
      "beta",
      "dns",
      "record-sets",
      "transaction",
      "start",
      `--zone=${dnsZone}`,
      "--project=${_GCP_PROJECT}"
    ]
  };
};
