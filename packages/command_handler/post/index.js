const deps = require("./deps");

module.exports = ({ version, mainFn, validateFn, cleanFn }) => {
  //eslint-disable-next-line no-console
  console.log("clean super is: ", cleanFn);
  return async (req, res) => {
    if (cleanFn) req.body.payload = await cleanFn(req.body.payload);
    if (validateFn) await validateFn(req.body.payload);
    const { payload, response } = await mainFn({
      payload: req.body.payload,
      context: req.context
    });
    const event = await deps.createEvent({
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
      .add(event)
      .in(req.context)
      .with(deps.gcpToken);

    res.status(200).send({
      ...response,
      root: event.headers.root
    });
  };
};
