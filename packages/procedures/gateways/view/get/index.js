const deps = require("./deps");

module.exports = ({ procedure, name, domain, service } = {}) => async (
  req,
  res
) => {
  switch (procedure) {
    case "view-store": {
      const { body: response } = await deps
        .viewStore({
          name,
          ...(domain && { domain }),
          ...(service && { service }),
        })
        .set({
          tokenFns: { internal: deps.gcpToken },
          context: req.context,
        })
        .read(req.query);

      res.status(200).send(response);
      break;
    }
    case "view-composite": {
      const { body: response } = await deps
        .viewComposite({
          name,
          ...(domain && { domain }),
          ...(service && { service }),
        })
        .set({
          tokenFns: { internal: deps.gcpToken },
          context: req.context,
        })
        .read(req.query);
      res.status(200).send(response);
      break;
    }
  }
};
