const deps = require("./deps");

module.exports = ({ name, context }) => {
  const play = ({
    token: { internalFn: internalTokenFn } = {},
    enqueue: { fn: enqueueFn, wait: enqueueWait } = {},
  } = {}) => ({ root, domain, service }) => {
    deps
      .rpc(name, context, "projection")
      .post({ root, domain, service })
      //TODO this line is ugly. The generic rpc package needs love.
      .in({})
      .with({
        ...(internalTokenFn && { internalFn: internalTokenFn }),
        ...(enqueueFn && {
          enqueueFn: enqueueFn({
            queue: `projection-${context}-${name}-play`,
            ...(enqueueWait && { wait: enqueueWait }),
          }),
        }),
      });
  };

  return {
    set: ({ token, enqueue }) => {
      return {
        play: play({ token, enqueue }),
      };
    },
    play: play(),
  };
};
