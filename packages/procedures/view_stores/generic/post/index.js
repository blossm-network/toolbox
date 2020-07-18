const deps = require("./deps");

const defaultFn = (update) => update;

module.exports = ({ writeFn, updateFn = defaultFn }) => {
  return async (req, res) => {
    if (!req.body.query)
      throw deps.badRequestError.message(
        "Missing query parameter in the body."
      );

    const customUpdate = updateFn(req.body.update);
    //TODO
    //eslint-disable-next-line no-console
    console.log({ customUpdate });

    const formattedBody = {};

    for (const key in customUpdate.body)
      formattedBody[`body.${key}`] = customUpdate.body[key];

    const data = {
      ...formattedBody,
      ...(customUpdate.trace && { "headers.trace": customUpdate.trace }),
      ...(customUpdate.context && { "headers.context": customUpdate.context }),
      "headers.modified": deps.dateString(),
    };

    //TODO
    //eslint-disable-next-line no-console
    console.log({ data });

    const newView = await writeFn({
      query: req.body.query,
      data,
    });

    res.status(200).send(newView);
  };
};
