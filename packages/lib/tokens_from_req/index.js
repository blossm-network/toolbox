module.exports = (req, { cookieKey } = {}) => {
  const authorization = req.headers.authorization;
  const cookies = req.cookies || {};

  const token = cookieKey && cookies[cookieKey];

  //TODO
  console.log({ cookies, token, cookieKey, authorization });
  const tokens = {
    ...(token != undefined && { cookie: token }),
  };

  if (authorization == undefined) return tokens;

  const components = authorization.split(" ");

  return {
    ...tokens,
    ...(components[0] == "Bearer" && { bearer: components[1] }),
    ...(components[0] == "Basic" && { basic: components[1] }),
  };
};
