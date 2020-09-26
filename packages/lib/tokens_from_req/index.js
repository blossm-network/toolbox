module.exports = (req, { cookieKey, allowsQueryToken = false } = {}) => {
  const authorization = req.headers.authorization;
  const cookies = req.cookies || {};

  const token = cookieKey && cookies[cookieKey];

  const tokens = {
    ...(token != undefined && { cookie: token }),
  };

  //TODO
  console.log({ cookies, token, query: req.query });

  if (authorization == undefined && (!allowsQueryToken || !req.query.bearer))
    return tokens;

  const components = authorization && authorization.split(" ");

  return {
    ...tokens,
    ...(components && components[0] == "Bearer" && { bearer: components[1] }),
    ...(allowsQueryToken && req.query.bearer && { bearer: req.query.bearer }),
    ...(components && components[0] == "Basic" && { basic: components[1] }),
  };
};
