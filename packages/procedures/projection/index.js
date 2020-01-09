const deps = require("./deps");

module.exports = async ({ mainFn, name, domain = process.env.DOMAIN } = {}) => {
  deps.eventHandler({
    mainFn: async event =>
      deps
        .viewStore({
          name,
          domain
        })
        .set({ context: event.headers.context, tokenFn: deps.gcpToken })
        .update(event.headers.root, await mainFn(event))
  });
};
