import deps from "./deps.js";

export default ({
  name,
  domain,
  service,
  network,
  internalTokenFn,
  nodeExternalTokenFn,
  stream,
  raw,
  root,
} = {}) => async (req, res) => {
  if (root && !req.params.root)
    throw deps.badRequestError.message("A root is required.");

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
    const controller = new AbortController();
    const disconnected = () => controller.abort(new DOMException("The client disconnected.", "AbortError"));
    res.once("close", disconnected);
    try {
      await procedure.stream(
        (data) => deps.write(res, data),
        {
          query: req.query,
          ...(req.params.root && { root: req.params.root }),
          onResponseFn: (response) => res.writeHead(response.statusCode, deps.forwardHeaders(response.headers)),
          signal: controller.signal,
          raw: true,
        }
      );
      res.end();
    } finally {
      res.removeListener("close", disconnected);
    }
  } else {
    const { body: response, headers = {} } = await procedure.read({
      query: req.query,
      ...(req.params.root && { root: req.params.root }),
      ...(raw && { raw }),
    });

    res.set(deps.forwardHeaders(headers)).status(200).send(response);
  }
};
