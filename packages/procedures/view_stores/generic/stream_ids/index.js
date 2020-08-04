const defaultFn = (query) => query;

//NOT MEANT TO BE PUBLIC SINCE THERES NO REQUIRED CONTEXT CHECK.
module.exports = ({ streamFn, queryFn = defaultFn }) => {
  return async (req, res) => {
    const queryBody = queryFn(req.query.query || {});
    const formattedQueryBody = {};
    for (const key in queryBody)
      formattedQueryBody[`body.${key}`] = queryBody[key];

    await streamFn({
      query: {
        ...formattedQueryBody,
        ...(req.query.context && {
          "headers.context": {
            root: req.query.context[process.env.CONTEXT].root,
            domain: process.env.CONTEXT,
            service: req.query.context[process.env.CONTEXT].service,
            network: req.query.context[process.env.CONTEXT].network,
          },
        }),
      },
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
