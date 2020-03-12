const deps = require("./deps");

module.exports = ({
  mainFn,
  validateFn,
  normalizeFn,
  fillFn,
  aggregateFn,
  addFn
}) => {
  return async (req, res) => {
    if (validateFn) await validateFn(req.body.payload);
    if (fillFn) req.body.payload = await fillFn(req.body.payload);
    if (normalizeFn) req.body.payload = await normalizeFn(req.body.payload);

    const { events = [], response, thenFn } = await mainFn({
      payload: req.body.payload,
      ...(req.body.root && { root: req.body.root }),
      ...(req.body.options && { options: req.body.options }),
      claims: req.body.claims,
      context: req.body.context,
      aggregateFn: aggregateFn({
        context: req.body.context,
        claims: req.body.claims
      })
    });

    const eventsPerStore = {};

    for (const {
      root,
      payload = {},
      correctNumber,
      version = 0,
      action,
      domain = process.env.DOMAIN
    } of events) {
      const eventData = deps.createEvent({
        ...(root && { root }),
        payload,
        trace: req.body.headers.trace,
        version,
        action,
        domain,
        service: process.env.SERVICE,
        idempotency: req.body.headers.idempotency,
        command: {
          id: req.body.headers.id,
          issued: req.body.headers.issued,
          name: process.env.NAME,
          domain: process.env.DOMAIN,
          service: process.env.SERVICE,
          network: process.env.NETWORK
        }
      });
      const normalizedEvent = {
        data: eventData,
        ...(correctNumber && { number: correctNumber })
      };
      eventsPerStore[domain] = eventsPerStore[domain]
        ? eventsPerStore[domain].concat([normalizedEvent])
        : [normalizedEvent];
    }

    const fns = [];
    for (const domain in eventsPerStore) {
      fns.push(
        addFn({
          domain,
          context: req.body.context,
          claims: req.body.claims,
          events: eventsPerStore[domain]
        })
      );
    }

    await Promise.all(fns);

    if (thenFn) await thenFn();
    res.status(response ? 200 : 204).send(response);
  };
};
