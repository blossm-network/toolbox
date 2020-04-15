const deps = require("./deps");

const defaultFn = view => view;

module.exports = ({ writeFn, viewFn = defaultFn }) => {
  return async (req, res) => {
    if (req.params.root == undefined) throw deps.badRequestError.missingRoot();

    const customView = viewFn(req.body.view);

    const formattedBody = {};
    for (const key in customView.body) {
      formattedBody[`body.${key}`] = customView.body[key];
    }

    const formattedHeaders = {};
    for (const key in customView.headers || {}) {
      formattedHeaders[`headers.${key}`] = customView.headers[key];
    }

    const data = {
      ...formattedBody,
      ...formattedHeaders,
      "headers.modified": deps.dateString()
    };

    await writeFn({
      root: req.params.root,
      data
    });

    res.status(204).send();
  };
};
