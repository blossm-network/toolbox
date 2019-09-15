const deps = require("./deps");

///https://cloud.google.com/run/docs/authenticating/service-to-service
module.exports = async ({ operation }) => {
  const metadataServerTokenUrl =
    "https://metadata/computeMetadata/v1/instance/service-accounts/default/identity?audience=";

  const headers = { "Metadata-Flavor": "Google" };

  const operationName = operation
    .split(".")
    .reverse()
    .join("-");

  const url = `https://${operationName}-ixixyzl3ea-uc.a.run.app`;

  const response = await deps.get(metadataServerTokenUrl + url, null, headers);

  return response.body;
};
