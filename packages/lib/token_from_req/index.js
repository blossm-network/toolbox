module.exports = req => {
  return req.authorization.scheme == "Bearer"
    ? req.authorization.credentials
    : null;
};
