const deps = require("./deps");

const serverId = () => {
  switch (process.env.NODE_ENV) {
    case "staging":
      return "p3u6hkyfwa";
    case "sandbox":
      return "ixixyzl3ea";
    case "production":
      return "qzhmgyrp2q";
    default:
      return null;
  }
};

///https://cloud.google.com/run/docs/authenticating/service-to-service
module.exports = async ({ name, hash }) => {
  const id = serverId();

  if (!id) return null;

  const metadataServerTokenUrl =
    "http://metadata/computeMetadata/v1/instance/service-accounts/default/identity?audience=";

  const headers = { "Metadata-Flavor": "Google" };

  const url = `https://${process.env.GCP_REGION}-${name}-${hash}-${id}-uc.a.run.app`;

  const response = await deps.get(metadataServerTokenUrl + url, { headers });

  if (response.statusCode >= 300) return null;
  return response.body;
};
