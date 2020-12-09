const deps = require("./deps");

module.exports = (storeQueries) => {
  const stream = ({
    context,
    claims,
    token: { internalFn: internalTokenFn, externalFn: externalTokenFn } = {},
  } = {}) => (fn, sortFn) =>
    deps
      .stream(storeQueries, fn, sortFn)
      .in({
        ...(context && { context }),
      })
      .with({
        path: `/stream`,
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims }),
      });

  return {
    set: ({ context, claims, token } = {}) => {
      return {
        stream: stream({ context, claims, token }),
      };
    },
    stream: stream(),
  };
};
