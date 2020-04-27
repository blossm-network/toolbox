const deps = require("./deps");

const defaultFn = (view) => view;

module.exports = ({ writeFn, viewFn = defaultFn }) => {
  return async (req, res) => {
    if (req.params.root == undefined)
      throw deps.badRequestError.message("Missing root url parameter.");

    const customView = viewFn(req.body.view);

    const formattedBody = {};
    const formattedHeaders = {};

    for (const key in customView.body)
      formattedBody[`body.${key}`] = customView.body[key];

    for (const key in customView.headers || {})
      formattedHeaders[`headers.${key}`] = customView.headers[key];

    const data = {
      ...formattedBody,
      ...formattedHeaders,
      "headers.modified": deps.dateString(),
    };

    const newView = await writeFn({
      root: req.params.root,
      data,
    });

    res.status(200).send(newView);
  };
};
