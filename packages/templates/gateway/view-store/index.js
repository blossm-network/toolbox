const deps = require("./deps");

module.exports = () => {
  return async (req, res) => {
    const response = await deps
      .viewStore({
        name: req.params.name,
        domain: req.params.domain,
        service: process.env.SERVICE,
        network: process.env.NETWORK
      })
      .read(req.query)
      .in(req.context)
      .with(deps.gcpToken);

    res.send(response);
  };
};
