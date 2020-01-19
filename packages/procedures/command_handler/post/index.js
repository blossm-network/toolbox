const deps = require("./deps");

const { badRequest } = require("@blossm/errors");

module.exports = ({ mainFn, validateFn, normalizeFn, fillFn }) => {
  return async (req, res) => {
    //eslint-disable-next-line
    console.log("req body: ", req.body);
    if (validateFn) await validateFn(req.body.payload);
    if (fillFn) req.body.payload = await fillFn(req.body.payload);
    if (normalizeFn) req.body.payload = await normalizeFn(req.body.payload);
    //eslint-disable-next-line
    console.log("processed body: ", req.body);

    const aggregateFn = async (
      root,
      {
        domain = process.env.DOMAIN,
        service = process.env.SERVICE,
        network = process.env.NETWORK
      } = {}
    ) => {
      const aggregate = await deps
        .eventStore({ domain, service, network })
        .set({ context: req.body.context, tokenFn: deps.gcpToken })
        .aggregate(root);

      //eslint-disable-next-line
      console.log("aggregate: ", {
        aggregate,
        root
      });
      if (!aggregate) throw badRequest.badRoot({ info: { root } });

      return {
        lastEventNumber: aggregate.headers.lastEventNumber,
        aggregate: aggregate.state
      };
    };

    const { events = [], response } = await mainFn({
      payload: req.body.payload,
      ...(req.body.root && { root: req.body.root }),
      ...(req.body.options && { options: req.body.options }),
      context: req.body.context,
      aggregateFn
    });

    const synchronousFns = [];
    let asynchronousFns = [];
    for (const {
      root,
      payload,
      correctNumber,
      version = 0,
      action = process.env.ACTION,
      domain = process.env.DOMAIN
    } of events) {
      const fn = async () => {
        const event = await deps.createEvent({
          ...(root && { root }),
          payload,
          trace: req.body.headers.trace,
          context: req.body.context,
          version,
          action,
          domain,
          service: process.env.SERVICE,
          idempotency: req.body.headers.idempotency,
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
          .eventStore({ domain })
          .set({ context: req.body.context, tokenFn: deps.gcpToken })
          .add(event, { number: correctNumber });
      };

      if (correctNumber == undefined) {
        asynchronousFns.push(fn);
      } else {
        synchronousFns.push(
          async () => await Promise.all(asynchronousFns.map(f => f()))
        );
        synchronousFns.push(fn);
        asynchronousFns = [];
      }
    }

    for (const fn of [
      ...synchronousFns,
      ...(asynchronousFns.length > 0
        ? [async () => await Promise.all(asynchronousFns.map(f => f()))]
        : [])
    ]) {
      await fn();
    }

    res.status(response ? 200 : 204).send(response);
  };
};
