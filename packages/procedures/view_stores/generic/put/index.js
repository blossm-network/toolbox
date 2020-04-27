const deps = require("./deps");

const defaultFn = (view) => view;

module.exports = ({ writeFn, viewFn = defaultFn }) => {
  return async (req, res) => {
    if (req.params.root == undefined)
      throw deps.badRequestError.message("Missing root url parameter.");

    //TODO
    //eslint-disable-next-line no-console
    console.log({ body: req.body, view: req.body.view });

    const customView = viewFn(req.body.view);

    //TODO
    //eslint-disable-next-line no-console
    console.log({ customView, body: customView.body });

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

    //TODO
    //eslint-disable-next-line no-console
    console.log({ data });

    const newView = await writeFn({
      root: req.params.root,
      data,
    });

    //TODO
    //eslint-disable-next-line no-console
    console.log({ newView });

    res.status(200).send(newView);
  };
};
