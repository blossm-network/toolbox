const deps = require("./deps");

module.exports = ({ version, mainFn, validateFn, normalizeFn }) => {
  return async (req, res) => {
    if (validateFn) await validateFn(req.body.payload);
    if (normalizeFn) req.body.payload = await normalizeFn(req.body.payload);

    //TODO gateway should send context to command handler
    //Add req.body.context as a fallback for internal testing without a gateway.
    const context = req.context || req.body.context;

    const { payload, root = req.body.headers.root, response } = await mainFn({
      payload: req.body.payload,
      ...(req.body.headers.root && { root: req.body.headers.root }),
      context
    });
    const event = await deps.createEvent({
      ...(root && { root }),
      payload,
      trace: req.body.headers.trace,
      context,
      version,
      command: {
        id: req.body.headers.id,
        issued: req.body.headers.issued,
        action: process.env.ACTION,
        domain: process.env.DOMAIN,
        service: process.env.SERVICE,
        network: process.env.NETWORK
      }
    });
    await deps
      .eventStore({ domain: process.env.DOMAIN })
      .set({ context, tokenFn: deps.gcpToken })
      .add(event);

    res.status(200).send({
      ...response,
      root: event.headers.root
    });
  };
};
