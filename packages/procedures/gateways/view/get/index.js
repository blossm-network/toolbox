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

      const updates = `https://f.channel.updates.system.${
        process.env.CORE_NETWORK
      }${
        domain && service
          ? `?domain=${domain}&${domain}%5Broot%5D=${req.query.root}&${domain}%5Bservice%5D=${service}&${domain}%5Bnetwork%5D=${process.env.NETWORK}`
          : ""
      }`;

      res.status(200).send({ ...response, updates });
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
