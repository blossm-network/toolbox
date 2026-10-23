import gcpSecret from "@blossm/gcp-secret";
import connectionToken from "@blossm/connection-token";
import environmentName from "./environment_name.js";

export default connectionToken({
  credentialsFn: async ({ network }) => {
    const nameRoot = environmentName(network);

    const root = process.env[`${nameRoot}_KEY_ROOT`];
    const secretName = process.env[`${nameRoot}_KEY_SECRET_NAME`];

    if (!root || !secretName) return null;
    return {
      root,
      secret: await gcpSecret.get(secretName),
    };
  },
});
