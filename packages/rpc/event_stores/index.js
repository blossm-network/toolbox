const deps = require("./deps");

module.exports = (storeQueries) => {
  const stream = ({
    context,
    claims,
    token: {
      internalFn: internalTokenFn,
      externalFn: externalTokenFn,
      key,
    } = {},
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
        ...(key && { key }),
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
