module.exports = req => {
  const headers = req.headers;
  const authorization = headers.authorization;

  if (authorization == undefined) return {};

  const components = authorization.split(" ");

  return {
    ...(components[0] == "Bearer" && { bearer: components[1] }),
    ...(components[0] == "Basic" && { basic: components[1] })
  };
};
