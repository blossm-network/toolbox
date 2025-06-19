import deps from "./deps.js";

const defaultFn = (update) => update;

//Returns the value, or values, of a given key in an object.
const getValue = (object, key) => {
  const keyParts = key.split(".");
  return keyParts.length > 1
    ? object[keyParts[0]] instanceof Array
      ? object[keyParts[0]].map((element) =>
          getValue(element, keyParts.slice(1).join("."))
        )
      : getValue(object[keyParts[0]], keyParts.slice(1).join("."))
    : object[keyParts[0]];
};

const formatBody = (value) => {
  const formattedBody = {};

  for (const key in value) {
    if (key.startsWith("$") && typeof value[key] == "object") {
      formattedBody[key] = formatBody(value[key]);
    } else {
      formattedBody[`body.${key}`] = value[key];
    }
  }

  return formattedBody;
};

//NOT MEANT TO BE PUBLIC SINCE THERES NO REQUIRED CONTEXT CHECK.
export default ({
  writeFn,
  formatFn,
  updateFn = defaultFn,
  updateKeys,
}) => async (req, res) => {
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

  const formattedBody = formatBody(customUpdate);

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
    ...(req.body.arrayFilters && { arrayFilters: req.body.arrayFilters }),
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

  const values =
    updateKeys && updateKeys.map((key) => getValue(newView.body, key));

  res.status(200).send({
    view: {
      ...formatFn({
        body: newView.body,
        id: newView.headers.id,
        created: newView.headers.created,
        modified: newView.headers.modified,
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
    ...(values && {
      // Fallback for .flat().
      keys: [].concat(...values),
    }),
  });
};
