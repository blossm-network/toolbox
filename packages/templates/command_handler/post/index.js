const deps = require("./deps");

module.exports = ({ version, mainFn, validateFn, normalizeFn }) => {
  return async (req, res) => {
    if (validateFn) await validateFn(req.body.payload);
    if (normalizeFn) req.body.payload = await normalizeFn(req.body.payload);
    const { payload, response } = await mainFn({
      payload: req.body.payload,
      context: req.context
    });
    const event = await deps.createEvent({
      ...(req.body.headers.root && { root: req.body.headers.root }),
      payload,
      trace: req.body.headers.trace,
      context: req.context,
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
      .eventStore({
        domain: process.env.DOMAIN,
        service: process.env.SERVICE,
        network: process.env.NETWORK
      })
      .set({ context: req.context, tokenFn: deps.gcpToken })
      .add(event);

    res.status(200).send({
      ...response,
      root: event.headers.root
    });
  };
};
