const { get: secret } = require("@blossm/gcp-secret");
const connectionToken = require("@blossm/connection-token");

module.exports = connectionToken({
  credentialsFn: async ({ network }) => {
    const nameRoot = network.toUpperCase().split(".").slice(-2).join("_");

    const id = process.env[`${nameRoot}_KEY_ID`];
    const secretName = process.env[`${nameRoot}_KEY_SECRET_NAME`];

    if (!id || !secretName) return null;
    return {
      id,
      secret: await secret(secretName),
    };
  },
});
