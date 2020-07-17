const deps = require("./deps");

const defaultFn = (update) => update;

//TODO test and change things from PUT to POST
module.exports = ({ writeFn, updateFn = defaultFn }) => {
  return async (req, res) => {
    // if (req.params.root == undefined)
    //   throw deps.badRequestError.message("Missing root url parameter.");

    const customUpdate = updateFn(req.body.update);

    const formattedBody = {};
    const formattedHeaders = {};

    for (const key in customUpdate.body)
      formattedBody[`body.${key}`] = customUpdate.body[key];

    for (const key in customUpdate.headers || {})
      formattedHeaders[`headers.${key}`] = customUpdate.headers[key];

    const data = {
      ...formattedBody,
      ...formattedHeaders,
      "headers.modified": deps.dateString(),
    };

    const newView = await writeFn({
      query: req.body.query,
      data,
    });

    res.status(200).send(newView);
  };
};
