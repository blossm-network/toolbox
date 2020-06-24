const defaultFn = (query) => query;

module.exports = ({ streamFn, queryFn = defaultFn }) => {
  return async (req, res) => {
    const queryBody = queryFn(req.query.query || {});
    const formattedQueryBody = {};
    for (const key in queryBody) {
      formattedQueryBody[`body.${key}`] = queryBody[key];
    }

    const context = req.query.context[process.env.CONTEXT];

    await streamFn({
      query: {
        ...formattedQueryBody,
        [`headers.${process.env.CONTEXT}`]: {
          root: context.root,
          service: context.service,
          network: context.network,
        },
        ...(req.params.root &&
          process.env.DOMAIN &&
          process.env.SERVICE && {
            [`headers.${process.env.DOMAIN}`]: {
              root: req.params.root,
              service: process.env.SERVICE,
              network: process.env.NETWORK,
            },
          }),
      },
      ...(req.query.sort && { sort: req.query.sort }),
      ...(req.query.parallel && { parallel: req.query.parallel }),
      fn: (view) => {
        res.write(
          JSON.stringify({
            body: view.body,
            headers: { root: view.headers.root, trace: view.headers.trace },
          })
        ),
          res.flush();
      },
    });

    res.end();
  };
};
