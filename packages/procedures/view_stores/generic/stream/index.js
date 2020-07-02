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
        "headers.context": {
          root: context.root,
          domain: process.env.CONTEXT,
          service: context.service,
          network: context.network,
        },
        ...(req.params.sourceRoot &&
          req.params.sourceDomain &&
          req.params.sourceService &&
          req.params.sourceNetwork && {
            "headers.sources.root": req.params.sourceRoot,
            "headers.sources.domain": req.params.sourceDomain,
            "headers.sources.service": req.params.sourceService,
            "headers.sources.network": req.params.sourceNetwork,
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
        );
      },
    });

    res.end();
  };
};
