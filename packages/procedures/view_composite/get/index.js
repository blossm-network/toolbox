// The caller's token, forwarded in a header so it stays out of request logs.
const forwardedToken = (req) => req.headers && req.headers["blossm-token"];

export default ({ mainFn, viewsFn }) => {
  return async (req, res) => {
    const response = await mainFn({
      query: req.query.query,
      ...(req.query.context && { context: req.query.context }),
      viewsFn: viewsFn({
        ...(req.query.context && { context: req.query.context }),
        ...(req.query.claims && { claims: req.query.claims }),
        ...(forwardedToken(req) && { token: forwardedToken(req) }),
      }),
    });

    res.status(200).send(response);
  };
};
