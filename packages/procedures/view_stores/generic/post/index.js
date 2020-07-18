const deps = require("./deps");

const defaultFn = (update) => update;

module.exports = ({ writeFn, updateFn = defaultFn }) => {
  return async (req, res) => {
    //TODO
    //eslint-disable-next-line no-console
    console.log("HELLL$O");
    if (!req.body.query)
      throw deps.badRequestError.message(
        "Missing query parameter in the body."
      );

    //TODO
    //eslint-disable-next-line no-console
    console.log({ boidy: req.body, env: process.env.CONTEXT });

    const context = req.body.context[process.env.CONTEXT];
    //TODO
    //eslint-disable-next-line no-console
    console.log({ context });

    if (!context)
      throw deps.forbiddenError.message("Missing required permissions.");

    const customUpdate = updateFn(req.body.update);

    //TODO
    //eslint-disable-next-line no-console
    console.log({ customUpdate });

    const contextProperty = {
      root: context.root,
      domain: process.env.CONTEXT,
      service: context.service,
      network: context.network,
    };

    const formattedBody = {};

    for (const key in customUpdate.body)
      formattedBody[`body.${key}`] = customUpdate.body[key];

    const data = {
      ...formattedBody,
      ...(customUpdate.trace && { "headers.trace": customUpdate.trace }),
      "headers.context": contextProperty,
      "headers.modified": deps.dateString(),
    };

    //TODO
    //eslint-disable-next-line no-console
    console.log({ data });

    const formattedQuery = {};
    for (const key in req.body.query) {
      formattedQuery[`body.${key}`] = req.body.query[key];
    }
    const newView = await writeFn({
      query: {
        ...formattedQuery,
        "headers.context.root": contextProperty.root,
        "headers.context.domain": contextProperty.domain,
        "headers.context.service": contextProperty.service,
        "headers.context.network": contextProperty.network,
      },
      data,
    });

    //TODO
    //eslint-disable-next-line no-console
    console.log({ newView });

    res.status(200).send(newView);
  };
};
