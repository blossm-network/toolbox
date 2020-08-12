const deps = require("./deps");

module.exports = ({
  mainFn,
  validateFn,
  normalizeFn,
  fillFn,
  aggregateFn,
  commandFn,
  queryAggregatesFn,
  readFactFn,
  streamFactFn,
  countFn,
  addFn,
}) => async (req, res) => {
  if (validateFn) {
    await validateFn(req.body.payload, {
      ...(req.body.context && { context: req.body.context }),
    });
  }
  if (fillFn) req.body.payload = await fillFn(req.body.payload);
  if (normalizeFn) req.body.payload = await normalizeFn(req.body.payload);

  const commandId = deps.uuid();
  const txId = (req.body.tx && req.body.tx.id) || deps.uuid();

  const path = [
    ...(req.body.tx.path || []),
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
  ];

  const {
    events = [],
    response,
    headers = {},
    statusCode,
    thenFn,
  } = await mainFn({
    payload: req.body.payload,
    ...(req.body.root && { root: req.body.root }),
    ...(req.body.options && { options: req.body.options }),
    ...(req.body.claims && { claims: req.body.claims }),
    ...(req.body.context && { context: req.body.context }),
    ...(req.body.tx.ip && { ip: req.body.tx.ip }),
    aggregateFn: aggregateFn({
      ...(req.body.context && { context: req.body.context }),
      ...(req.body.claims && { claims: req.body.claims }),
      ...(req.body.token && { token: req.body.token }),
    }),
    queryAggregatesFn: queryAggregatesFn({
      ...(req.body.context && { context: req.body.context }),
      ...(req.body.claims && { claims: req.body.claims }),
      ...(req.body.token && { token: req.body.token }),
    }),
    readFactFn: readFactFn({
      ...(req.body.context && { context: req.body.context }),
      ...(req.body.claims && { claims: req.body.claims }),
      ...(req.body.token && { token: req.body.token }),
    }),
    streamFactFn: streamFactFn({
      ...(req.body.context && { context: req.body.context }),
      ...(req.body.claims && { claims: req.body.claims }),
      ...(req.body.token && { token: req.body.token }),
    }),
    commandFn: commandFn({
      ...(req.body.claims && { claims: req.body.claims }),
      ...(req.body.context && { context: req.body.context }),
      ...(req.body.token && { token: req.body.token }),
      ...(req.body.tx.ip && { ip: req.body.tx.ip }),
      ...(req.body.headers.idempotency && {
        idempotency: req.body.headers.idempotency,
      }),
      txId,
      path,
    }),
    countFn: countFn({
      ...(req.body.context && { context: req.body.context }),
      ...(req.body.claims && { claims: req.body.claims }),
      ...(req.body.token && { token: req.body.token }),
    }),
  });

  const eventDataPerStore = {};

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
    const event = deps.createEvent({
      ...(root && { root }),
      payload,
      version,
      action,
      domain,
      service,
      network: process.env.NETWORK,
      ...(req.body.headers.idempotency && {
        idempotency: req.body.headers.idempotency,
      }),
      ...((context || req.body.context) && {
        context: context || req.body.context,
      }),
      path,
    });
    const normalizedEventData = {
      event,
      ...(correctNumber && { number: correctNumber }),
    };

    eventDataPerStore[service] = eventDataPerStore[service] || {};

    eventDataPerStore[service][domain] = eventDataPerStore[service][domain]
      ? eventDataPerStore[service][domain].concat([normalizedEventData])
      : [normalizedEventData];
  }

  const fns = [];
  for (const service in eventDataPerStore) {
    for (const domain in eventDataPerStore[service]) {
      fns.push(
        addFn({
          domain,
          service,
          ...(req.body.context && { context: req.body.context }),
          ...(req.body.claims && { claims: req.body.claims }),
          eventData: eventDataPerStore[service][domain],
          async: !eventDataPerStore[service][domain].some(
            (normalizedEvent) => normalizedEvent.number != undefined
          ),
          tx: {
            ...(req.body.tx.ip && { ip: req.body.tx.ip }),
            id: txId,
            path,
          },
        })
      );
    }
  }

  await Promise.all(fns);

  if (thenFn) await thenFn();

  if (response || events.length) {
    res
      .set(headers)
      .status(statusCode || (events.length ? 202 : 200))
      .send({
        ...response,
        ...(events.length && { _id: commandId, _tx: txId }),
      });
  } else {
    res.set(headers).sendStatus(204);
  }
};
