module.exports = payload => {
  return {
    context: {
      root: payload.context.root,
      service: payload.context.service,
      network: payload.context.network
    }
  };
};
