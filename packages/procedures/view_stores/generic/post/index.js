const deps = require("./deps");

const defaultFn = (update) => update;

module.exports = ({ writeFn, formatFn, updateFn = defaultFn }) => {
  return async (req, res) => {
    if (!req.body.context || !req.body.context[process.env.CONTEXT])
      throw deps.forbiddenError.message("Missing required permissions.");

    const customUpdate = updateFn(req.body.update);

    const context = {
      root: req.body.context[process.env.CONTEXT].root,
      domain: process.env.CONTEXT,
      service: req.body.context[process.env.CONTEXT].service,
      network: req.body.context[process.env.CONTEXT].network,
    };

    const formattedBody = {};

    for (const key in customUpdate)
      formattedBody[`body.${key}`] = customUpdate[key];

    const data = {
      ...formattedBody,
      ...(req.body.trace && {
        [`trace.${req.body.trace.service}.${req.body.trace.domain}`]: req.body
          .trace.txIds,
      }),
      ...(req.body.id && { "headers.id": req.body.id }),
      "headers.context": context,
      "headers.modified": deps.dateString(),
    };

    let formattedQuery;

    if (req.body.query) {
      if (!formattedQuery) formattedQuery = {};
      for (const key in req.body.query) {
        formattedQuery[`body.${key}`] = req.body.query[key];
      }
    }

    const newView = await writeFn({
      query: {
        ...formattedQuery,
        ...(req.body.id && { "headers.id": req.body.id }),
        "headers.context.root": context.root,
        "headers.context.domain": context.domain,
        "headers.context.service": context.service,
        "headers.context.network": context.network,
      },
      data,
      ...((req.body.upsert || req.body.id) && {
        upsert:
          req.body.upsert != undefined
            ? req.body.upsert
            : req.body.id != undefined,
      }),
    });

    res.status(200).send(formatFn(newView));
  };
};
