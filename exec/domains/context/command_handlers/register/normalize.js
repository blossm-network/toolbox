module.exports = async payload => {
  return {
    root: payload.root,
    domain: payload.domain,
    service: payload.service,
    network: payload.network
  };
};
