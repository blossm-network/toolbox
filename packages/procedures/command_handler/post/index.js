const deps = require("./deps");

const { badRequest } = require("@blossm/errors");

module.exports = ({ mainFn, validateFn, normalizeFn }) => {
  return async (req, res) => {
    if (validateFn) await validateFn(req.body.payload);
    if (normalizeFn) req.body.payload = await normalizeFn(req.body.payload);

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

      if (!aggregate) throw badRequest.badRoot({ info: { root } });

      return {
        lastEventNumber: aggregate.headers.lastEventNumber,
        aggregate: aggregate.state
      };
    };

    const { events = [], response } = await mainFn({
      payload: req.body.payload,
      ...(req.body.root && { root: req.body.root }),
      context: req.body.context,
      aggregateFn
    });

    const roots = [];
    for (const {
      root,
      payload,
      correctNumber,
      version = 0,
      action = process.env.ACTION,
      domain = process.env.DOMAIN
    } of events) {
      const event = await deps.createEvent({
        ...(root && { root }),
        payload,
        trace: req.body.headers.trace,
        context: req.body.context,
        version,
        action,
        domain,
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

      roots.push(event.headers.root);
    }

    res.status(200).send({
      ...response,
      roots
    });
  };
};
