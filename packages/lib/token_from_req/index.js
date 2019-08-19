module.exports = req => {
  const headers = req.headers;
  const authorization = headers.authorization;

  if (authorization == undefined) return null;

  const components = authorization.split(" ");

  return components[0] == "Bearer" ? components[1] : null;
};
