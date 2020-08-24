const deps = require("./deps");

const defaultFn = (update) => update;

//NOT MEANT TO BE PUBLIC SINCE THERES NO REQUIRED CONTEXT CHECK.
module.exports = ({ writeFn, formatFn, updateFn = defaultFn }) => {
  return async (req, res) => {
    const customUpdate = updateFn(req.body.update);

    const context = req.body.context &&
      process.env.CONTEXT &&
      req.body.context[process.env.CONTEXT] && {
        root: req.body.context[process.env.CONTEXT].root,
        domain: process.env.CONTEXT,
        service: req.body.context[process.env.CONTEXT].service,
        network: req.body.context[process.env.CONTEXT].network,
      };

    const groups =
      req.body.groups &&
      req.body.groups.map((group) => ({
        root: group.root,
        service: group.service,
        network: group.network,
      }));

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
      ...(groups && { "headers.groups": groups }),
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

    //TODO
    // const updates =
    //   process.env.CONTEXT &&
    //   `https://updates.${process.env.NETWORK}/channel?query%5Bname%5D=${process.env.NAME}&query%5Bcontext%5D=${process.env.CONTEXT}&query%5Bnetwork%5D=${process.env.NETWORK}`;

    res.status(200).send({
      ...formatFn({
        body: newView.body,
        id: newView.headers.id,
        //TODO
        // ...(updates && { updates }),
      }),
      headers: {
        id: newView.headers.id,
        context: newView.headers.context,
        ...(newView.headers.groups && { groups: newView.headers.groups }),
        trace: formattedTrace,
      },
    });
  };
};
