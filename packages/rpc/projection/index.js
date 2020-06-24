const deps = require("./deps");

module.exports = ({
  name,
  context,
  domain,
  service,
  eventsDomain,
  eventsService,
}) => {
  const replay = ({ token: { internalFn: internalTokenFn } = {} } = {}) => (
    root,
    { from: number = 0 } = {}
  ) => {
    const data = {
      message: {
        data: Buffer.from(
          JSON.stringify({
            root,
            forceFrom: number,
          })
        ),
      },
    };

    return (
      deps
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
        .with({ ...(internalTokenFn && { internalFn: internalTokenFn }) })
    );
  };

  return {
    set: ({ token }) => {
      return {
        replay: replay({ token }),
      };
    },
    replay: replay(),
  };
};
