const deps = require("./deps");

module.exports = ({
  name,
  context,
  domain,
  service,
  eventsDomain,
  eventsService,
}) => {
  const replay = ({
    tokenFns: { internal: internalTokenFn } = {},
  } = {}) => async (root, { from: number = 0 } = {}) => {
    const data = {
      root,
      forceFrom: number,
    };

    return await deps
      .rpc(
        name,
        ...(domain ? [domain] : []),
        ...(service ? [service] : []),
        context,
        eventsDomain,
        eventsService,
        "projection"
      )
      .post(data)
      //TODO this line is ugly. The generic rpc package needs love.
      .in({})
      .with({ internalTokenFn });
  };

  return {
    set: ({ tokenFns }) => {
      return {
        replay: replay({ tokenFns }),
      };
    },
    replay: replay(),
  };
};
