const deps = require("./deps");

///https://cloud.google.com/run/docs/authenticating/service-to-service
module.exports = async ({ name, hash }) => {
  const metadataServerTokenUrl =
    "http://metadata/computeMetadata/v1/instance/service-accounts/default/identity?audience=";

  const headers = { "Metadata-Flavor": "Google" };

  const url = `https://${process.env.GCP_REGION}-${name}-${hash}-${process.env.GCP_COMPUTE_URL_ID}-uc.a.run.app`;

  const response = await deps.get(metadataServerTokenUrl + url, { headers });

  if (response.statusCode >= 300) return null;

  return { token: response.body, type: "Bearer" };
};
