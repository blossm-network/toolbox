module.exports = async payload => {
  return {
    name: payload.name,
    roles: payload.roles
  };
};
