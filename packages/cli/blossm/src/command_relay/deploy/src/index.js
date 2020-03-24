const relay = require("@blossm/command-relay");
const eventStore = require("@blossm/event-store-rpc");
const { verify } = require("@blossm/gcp-kms");
const gcpToken = require("@blossm/gcp-token");
const { compare } = require("@blossm/crypt");

const config = require("./config.json");

module.exports = relay({
  whitelist: config.whitelist,
  verifyFn: ({ key }) =>
    verify({
      ring: "jwt",
      key,
      location: "global",
      version: "1",
      project: process.env.GCP_PROJECT
    }),
  keyClaimsFn: async ({ id, secret }) => {
    const [key] = await eventStore({ domain: "key" })
      .set({ tokenFn: gcpToken })
      .query({ key: "id", value: id });

    if (!key) throw "Key not found";

    if (!(await compare(secret, key.state.secret))) throw "Incorrect secret";

    return {
      context: {
        key: {
          root: key.headers.root,
          service: process.env.SERVICE,
          network: process.env.NETWORK
        },
        principle: key.state.principle,
        node: key.state.node,
        domain: "node"
      }
    };
  }
});
