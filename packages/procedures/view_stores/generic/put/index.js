const deps = require("./deps");

const defaultFn = (update) => update;

//NOT MEANT TO BE PUBLIC SINCE THERES NO REQUIRED CONTEXT CHECK.
module.exports = ({ writeFn, formatFn, updateFn = defaultFn }) => {
  return async (req, res) => {
    const customUpdate = updateFn(req.body.update);

    const context = req.body.context &&
      req.body.context[process.env.CONTEXT] && {
        root: req.body.context[process.env.CONTEXT].root,
        domain: process.env.CONTEXT,
        service: req.body.context[process.env.CONTEXT].service,
        network: req.body.context[process.env.CONTEXT].network,
      };

    const formattedBody = {};

    for (const key in customUpdate)
      formattedBody[`body.${key}`] = customUpdate[key];

    const data = {
      "headers.id": req.params.id,
      "headers.modified": deps.dateString(),
      ...formattedBody,
      ...(req.body.trace && {
        [`trace.${req.body.trace.service}.${req.body.trace.domain}`]: req.body
          .trace.txIds,
      }),
      ...(context && { "headers.context": context }),
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
        "headers.id": req.params.id,
        ...formattedQuery,
        ...(context && {
          "headers.context.root": context.root,
          "headers.context.domain": context.domain,
          "headers.context.service": context.service,
          "headers.context.network": context.network,
        }),
      },
      data,
    });

    if (!newView) return res.sendStatus(204);

    //TODO this function is duplicated in /get. Refactor.
    const formattedTrace = [];
    for (const service in newView.trace) {
      for (const domain in newView.trace[service]) {
        for (const txId of newView.trace[service][domain])
          if (!formattedTrace.includes(txId)) formattedTrace.push(txId);
      }
    }

    const updates = `https://updates.${process.env.CORE_NETWORK}/channel?query%5Bname%5D=${process.env.NAME}&query%5Bcontext%5D=${process.env.CONTEXT}&query%5Bnetwork%5D=${process.env.NETWORK}`;

    console.log({ newView });
    res.status(200).send({
      //TODO needs updates
      ...formatFn({ body: newView.body, id: newView.headers.id, updates }),
      headers: {
        id: newView.headers.id,
        context: newView.headers.context,
        trace: formattedTrace,
      },
    });
  };
};
