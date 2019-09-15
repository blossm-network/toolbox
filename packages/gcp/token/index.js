const deps = require("./deps");

///https://cloud.google.com/run/docs/authenticating/service-to-service
module.exports = async ({ url }) => {
  const metadataServerTokenUrl =
    "http://metadata/computeMetadata/v1/instance/service-accounts/default/identity?audience=";

  const headers = { "Metadata-Flavor": "Google" };

  return await deps.get(metadataServerTokenUrl + url, null, headers);
};
