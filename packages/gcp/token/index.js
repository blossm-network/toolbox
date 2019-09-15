const deps = require("./deps");

///https://cloud.google.com/run/docs/authenticating/service-to-service
module.exports = async ({ url }) => {
  const metadataServerTokenUrl =
    "https://metadata/computeMetadata/v1/instance/service-accounts/default/identity?audience=";

  const headers = { "Metadata-Flavor": "Google" };

  const response = await deps.get(metadataServerTokenUrl + url, null, headers);

  return response.body;
};
