const eventHandler = require("@blossm/event-handler");
const viewStore = require("@blossm/view-store-rpc");
const gcpToken = require("@blossm/gcp-token");

const main = require("./main.js");

const config = require("./config.json");

module.exports = eventHandler({
  mainFn: async (event) => {
    const {
      [process.env.DOMAIN]: {
        root: domainRoot,
        service: domainService,
        network: domainNetwork,
      } = {},
      root,
      body,
    } = await main(event);

    await viewStore({
      name: config.name,
      ...(config.domain && { domain: config.domain }),
      ...(config.service && { service: config.service }),
      context: config.context,
    })
      .set({
        context: event.headers.context,
        claims: event.headers.claims,
        tokenFns: { internal: gcpToken },
      })
      .update(root, {
        headers: {
          ...(event.headers.context &&
            event.headers.context[process.env.CONTEXT] && {
              [process.env.CONTEXT]: event.headers.context[process.env.CONTEXT],
            }),
          ...(process.env.DOMAIN &&
            domainRoot &&
            domainService &&
            domainNetwork && {
              [process.env.DOMAIN]: {
                root: domainRoot,
                service: domainService,
                network: domainNetwork,
              },
            }),
        },
        body: {
          ...body,
          ...(event.headers.trace && { trace: event.headers.trace }),
        },
      });
  },
});
