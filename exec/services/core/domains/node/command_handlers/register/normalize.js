module.exports = async payload => {
  return {
    network: payload.network.toLowerCase()
  };
};
