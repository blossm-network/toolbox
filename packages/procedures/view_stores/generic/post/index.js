const deps = require("./deps");

const defaultFn = (update) => update;

module.exports = ({ writeFn, updateFn = defaultFn }) => {
  return async (req, res) => {
    if (!req.body.context)
      throw deps.forbiddenError.message("Missing required permissions.");

    const customUpdate = updateFn(req.body.update);

    const context = {
      root: req.body.context.root,
      domain: process.env.CONTEXT,
      service: req.body.context.service,
      network: req.body.context.network,
    };

    //TODO
    console.log({ PostingWContexT: context });

    const formattedBody = {};

    for (const key in customUpdate.body)
      formattedBody[`body.${key}`] = customUpdate.body[key];

    const data = {
      ...formattedBody,
      ...(customUpdate.trace && { "headers.trace": customUpdate.trace }),
      "headers.context": context,
      "headers.modified": deps.dateString(),
    };

    let formattedQuery;

    if (req.body.query) {
      if (!formattedQuery) formattedQuery = {};
      for (const key in req.body.query) {
        formattedQuery[`body.${key}`] = req.body.query[key];
      }
    }

    //TODO
    console.log({ PostingWData: data, query: formattedQuery });
    const newView = await writeFn({
      query: {
        ...formattedQuery,
        "headers.context.root": context.root,
        "headers.context.domain": context.domain,
        "headers.context.service": context.service,
        "headers.context.network": context.network,
      },
      data,
    });

    //TODO
    console.log({ newView });
    res.status(200).send(newView);
  };
};
