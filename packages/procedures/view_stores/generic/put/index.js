const deps = require("./deps");

const defaultFn = body => body.view;

module.exports = ({ writeFn, dataFn = defaultFn }) => {
  return async (req, res) => {
    if (req.params.id == undefined) throw deps.badRequestError.missingId();

    // Can't set the id, root, created, or modified.
    delete req.body.view.id;
    delete req.body.view.root;
    delete req.body.view.created;
    delete req.body.view.modified;

    const customData = dataFn(req.body);

    const data = {
      ...customData,
      modified: deps.dateString()
    };

    await writeFn({
      id: req.params.id,
      data
    });

    res.status(204).send();
  };
};
