module.exports = req => {
  // eslint-disable-next-line no-console
  console.log("req: ", req);
  return null;
  // return req.authorization.scheme == "Bearer"
  //   ? req.authorization.credentials
  //   : null;
};
