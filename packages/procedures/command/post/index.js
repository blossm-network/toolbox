const deps = require("./deps");

module.exports = ({
  mainFn,
  validateFn,
  normalizeFn,
  fillFn,
  aggregateFn,
  addFn,
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
        claims: req.body.claims,
      }),
    });

    const commandId = deps.uuid();
    const eventsPerStore = {};

    for (const {
      root,
      payload = {},
      correctNumber,
      version = 0,
      action,
      context,
      domain = process.env.DOMAIN,
      service = process.env.SERVICE,
    } of events) {
      const eventData = deps.createEvent({
        ...(root && { root }),
        payload,
        trace: req.body.headers.trace,
        version,
        action,
        domain,
        service,
        idempotency: req.body.headers.idempotency,
        ...(context && { context }),
        path: [
          ...(req.body.headers.path || []),
          {
            procedure: process.env.PROCEDURE,
            id: commandId,
            timestamp: deps.dateString(),
            issued: req.body.headers.issued,
            name: process.env.NAME,
            domain: process.env.DOMAIN,
            service: process.env.SERVICE,
            network: process.env.NETWORK,
            host: process.env.HOST,
            hash: process.env.OPERATION_HASH,
          },
        ],
      });
      const normalizedEvent = {
        data: eventData,
        ...(correctNumber && { number: correctNumber }),
      };

      eventsPerStore[service] = eventsPerStore[service] || {};

      eventsPerStore[service][domain] = eventsPerStore[service][domain]
        ? eventsPerStore[service][domain].concat([normalizedEvent])
        : [normalizedEvent];
    }

    const fns = [];
    for (const service in eventsPerStore) {
      for (const domain in eventsPerStore[service]) {
        fns.push(
          addFn({
            domain,
            service,
            context: req.body.context,
            claims: req.body.claims,
            events: eventsPerStore[service][domain],
          })
        );
      }
    }

    await Promise.all(fns);

    if (thenFn) await thenFn();

    const formattedResponse = (response || events.length) && {
      ...response,
      ...(events.length && { _id: commandId }),
    };

    const statusCode = events.length ? 202 : formattedResponse ? 200 : 204;

    //TODO
    //eslint-disable-next-line no-console
    console.log({ statusCode, formattedResponse, events });
    res.status(statusCode).send(formattedResponse);
  };
};
