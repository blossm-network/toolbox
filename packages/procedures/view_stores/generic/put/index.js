const deps = require("./deps");

const defaultFn = (update) => update;

//This is duplicated in put
const getValue = (object, key) => {
  console.log({ key });
  const keyParts = key.split(".");
  return keyParts.length > 1
    ? object[keyParts[0]] instanceof Array
      ? object[keyParts[0]].map((element) =>
          getValue(element, keyParts.slice(1).join("."))
        )
      : getValue(object[keyParts[0]], keyParts.slice(1).join("."))
    : object[keyParts[0]];
};

//NOT MEANT TO BE PUBLIC SINCE THERES NO REQUIRED CONTEXT CHECK.
module.exports = ({ writeFn, formatFn, updateFn = defaultFn, updateKey }) => {
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

    const value = updateKey && getValue(newView.body, updateKey);

    res.status(200).send({
      view: {
        ...formatFn({
          body: newView.body,
          id: newView.headers.id,
        }),
        headers: {
          id: newView.headers.id,
          context: newView.headers.context,
          ...(newView.headers.groups && { groups: newView.headers.groups }),
          trace: formattedTrace,
          created: newView.headers.created,
          modified: newView.headers.modified,
        },
      },
      ...(value && { keys: value instanceof Array ? value : [value] }),
    });
  };
};
