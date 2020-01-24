const deps = require("./deps");

module.exports = async ({ fn, name, domain = process.env.DOMAIN } = {}) => {
  deps.eventHandler({
    mainFn: async event => {
      return deps
        .viewStore({
          name,
          domain
        })
        .set({
          context: event.headers.context,
          session: event.headers.session,
          tokenFn: deps.gcpToken
        })
        .update(event.headers.root, {
          ...(event.headers.trace && { trace: event.headers.trace }),
          ...(await fn(event))
        });
    }
  });
};
