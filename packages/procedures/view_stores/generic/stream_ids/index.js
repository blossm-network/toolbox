const defaultFn = (query) => query;

export const queryForIds = ({ query, context }) => {
  const formattedQueryBody = {};
  for (const key in query) formattedQueryBody[`body.${key}`] = query[key];
  return {
    ...formattedQueryBody,
    ...(context && {
      "headers.context": {
        root: context[process.env.CONTEXT].root,
        domain: process.env.CONTEXT,
        service: context[process.env.CONTEXT].service,
        network: context[process.env.CONTEXT].network,
      },
    }),
  };
};

//NOT MEANT TO BE PUBLIC SINCE THERES NO REQUIRED CONTEXT CHECK.
export default ({ streamFn, queryFn = defaultFn }) => {
  return async (req, res) => {
    const queryBody = queryFn(req.query.query || {});
    await streamFn({
      query: queryForIds({ query: queryBody, context: req.query.context }),
      ...(req.query.sort && { sort: req.query.sort }),
      ...(req.query.parallel && { parallel: req.query.parallel }),
      fn: (view) =>
        res.write(
          JSON.stringify({
            id: view.headers.id,
          })
        ),
    });

    res.end();
  };
};
