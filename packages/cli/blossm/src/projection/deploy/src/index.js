const eventHandler = require("@blossm/mongodb-event-handler");
const command = require("@blossm/command-rpc");
const viewStore = require("@blossm/view-store-rpc");
const eventStore = require("@blossm/event-store-rpc");
const gcpToken = require("@blossm/gcp-token");
const nodeExternalToken = require("@blossm/node-external-token");
const channelName = require("@blossm/channel-name");
const { get: secret } = require("@blossm/gcp-secret");

const handlers = require("./handlers.js");

const config = require("./config.json");

module.exports = eventHandler({
  mainFn: (state, event) => {
    if (!handlers[event.headers.action]) return state;

    const {
      source: {
        root: sourceRoot,
        domain: sourceDomain,
        service: sourceService,
        network: sourceNetwork,
      } = {},
      body,
    } = handlers[event.headers.action](state, event);

    return {
      headers: {
        root: event.headers.root,
        ...(event.headers.trace && { trace: event.headers.trace }),
        ...(event.headers.context &&
          event.headers.context[process.env.CONTEXT] && {
            [process.env.CONTEXT]: event.headers.context[process.env.CONTEXT],
          }),
        ...(sourceRoot &&
          sourceDomain &&
          sourceService &&
          sourceNetwork && {
            sources: [
              ...state.headers.sources.filter(
                (source) =>
                  source.root != sourceRoot &&
                  source.domain != sourceDomain &&
                  source.service != sourceService &&
                  source.network != sourceNetwork
              ),
              {
                root: sourceRoot,
                domain: sourceDomain,
                service: sourceService,
                network: sourceNetwork,
              },
            ],
          }),
      },
      body,
    };
  },
  commitFn: async (state) => {
    const { body: newView } = await viewStore({
      name: config.name,
      context: config.context,
    })
      .set({
        token: { internalFn: gcpToken },
      })
      .update(state.headers.root, {
        headers: state.headers,
        body: state.body,
      });

    const channels = [];
    if (newView.headers.sources.length > 0) {
      for (const source of newView.headers.sources) {
        const channel = channelName({
          name: process.env.NAME,
          sourceRoot: source.root,
          sourceDomain: source.domain,
          sourceService: source.service,
          sourceNetwork: source.network,
          context: process.env.CONTEXT,
          contextRoot: newView.headers[process.env.CONTEXT].root,
          contextService: newView.headers[process.env.CONTEXT].service,
          contextNetwork: newView.headers[process.env.CONTEXT].network,
        });
        channels.push(channel);
      }
    } else {
      const channel = channelName({
        name: process.env.NAME,
        context: process.env.CONTEXT,
        contextRoot: newView.headers[process.env.CONTEXT].root,
        contextService: newView.headers[process.env.CONTEXT].service,
        contextNetwork: newView.headers[process.env.CONTEXT].network,
      });
      channels.push(channel);
    }

    for (const channel of channels) {
      command({
        name: "push",
        domain: "updates",
        service: "system",
        network: process.env.CORE_NETWORK,
      })
        .set({
          token: {
            externalFn: nodeExternalToken,
            internalFn: gcpToken,
            key: "access",
          },
        })
        .issue({
          view: newView,
          channel,
        });
    }
  },
  streamFn: ({ root, from }, fn) =>
    eventStore({
      domain: process.env.STORE_DOMAIN,
      service: process.env.STORE_SERVICE,
    })
      .set({
        token: { internalFn: gcpToken },
      })
      .stream(fn, { root, from }),
  secretFn: secret,
});
