import gcpSecret from "@blossm/gcp-secret";
import connectionToken from "@blossm/connection-token";

export default connectionToken({
  credentialsFn: async ({ network }) => {
    const nameRoot = network.toUpperCase().split(".").slice(-2).join("_");

    const root = process.env[`${nameRoot}_KEY_ROOT`];
    const secretName = process.env[`${nameRoot}_KEY_SECRET_NAME`];

    if (!root || !secretName) return null;
    return {
      root,
      secret: await gcpSecret.get(secretName),
    };
  },
});
