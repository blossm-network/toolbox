const { get: secret } = require("@blossm/gcp-secret");
const connectionToken = require("@blossm/connection-token");

module.exports = connectionToken({
  credentialsFn: async ({ network }) => {
    const nameRoot = network.toUpperCase().split(".").slice(-2).join("_");

    const root = process.env[`${nameRoot}_KEY_ROOT`];
    const secretName = process.env[`${nameRoot}_KEY_SECRET_NAME`];

    if (!root || !secretName) return null;
    return {
      root,
      secret: await secret(secretName),
    };
  },
});
