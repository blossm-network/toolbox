module.exports = (req, { cookieKey } = {}) => {
  const headers = req.headers;
  const authorization = headers.authorization;
  const cookies = req.cookies || {};

  console.log({ cookies, json: JSON.stringify(cookies) });

  const token = cookieKey && cookies[cookieKey];

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
