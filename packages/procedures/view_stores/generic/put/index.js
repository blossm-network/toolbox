const deps = require("./deps");

const defaultFn = view => view;

module.exports = ({ writeFn, dataFn = defaultFn }) => {
  return async (req, res) => {
    if (req.params.root == undefined) throw deps.badRequestError.missingRoot();

    const customBody = dataFn(req.body.view);

    const formattedBody = {};
    for (const key in customBody) {
      formattedBody[`body.${key}`] = customBody[key];
    }
    const data = {
      ...formattedBody,
      "headers.modified": deps.dateString()
    };

    await writeFn({
      root: req.params.root,
      data
    });

    res.status(204).send();
  };
};
