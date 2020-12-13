const deps = require("./deps");

module.exports = ({
  name,
  domain,
  service,
  network,
  internalTokenFn,
  nodeExternalTokenFn,
  stream,
} = {}) => async (req, res) => {
  const procedure = deps
    .fact({
      name,
      domain,
      ...(service && { service }),
      ...(network && {
        network: `${
          process.env.NODE_ENV == "production" ? "" : "snd."
        }${network}`,
      }),
    })
    .set({
      token: {
        internalFn: internalTokenFn,
        externalFn: ({ network } = {}) =>
          req.token
            ? { token: req.token, type: "Bearer" }
            : nodeExternalTokenFn({ network }),
      },
      ...(req.token && { currentToken: req.token }),
      ...(req.context && { context: req.context }),
      ...(req.claims && { claims: req.claims }),
    });
  if (stream) {
    console.log("streaming");
    res.writeHead(200, { "Content-Type": "image/jpeg" });
    await procedure.stream(
      (data) =>
        res.write(
          typeof data === "object" && !Buffer.isBuffer(data) && data !== null
            ? JSON.stringify(data)
            : data
        ),
      {
        query: req.query,
        ...(req.params.root && { root: req.params.root }),
        onResponseFn: (response) => {
          //TODO
          console.log({ sc: response.statusCode, h: response.headers });
          res.writeHead(response.statusCode, response.headers);
        },
        raw: true,
      }
    );
    res.end();
  } else {
    const { body: response, headers = {} } = await procedure.read({
      query: req.query,
      ...(req.params.root && { root: req.params.root }),
    });

    res.set(headers).status(200).send(response);
  }
};
