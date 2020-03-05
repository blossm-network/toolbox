module.exports = async payload => {
  return {
    domain: payload.domain.toLowerCase()
  };
};
