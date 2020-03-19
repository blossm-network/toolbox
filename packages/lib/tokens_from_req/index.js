module.exports = (req, { cookieKey } = {}) => {
  //TODO
  //eslint-disable-next-line no-console
  console.log({ tokenHeaders: req.headers });
  const headers = req.headers;
  const authorization = headers.authorization;
  const cookies = req.cookies || {};

  const token = cookieKey && cookies[cookieKey];
  const tokens = {
    ...(token != undefined && { cookie: token })
  };

  //TODO
  //eslint-disable-next-line no-console
  console.log({ authorization });

  if (authorization == undefined) return tokens;

  const components = authorization.split(" ");

  //TODO
  //eslint-disable-next-line no-console
  console.log({ components });

  const base64Credentials = components[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "ascii"
  );
  //TODO
  //eslint-disable-next-line no-console
  console.log({ credentials });
  const [username, password] = credentials.split(":");
  //TODO
  //eslint-disable-next-line no-console
  console.log({ username, password });
  return {
    ...tokens,
    ...(components[0] == "Bearer" && { bearer: components[1] }),
    ...(components[0] == "Basic" && { basic: components[1] })
  };
};
