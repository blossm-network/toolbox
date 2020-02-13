const deps = require("./deps");

const defaultFn = body => body;

module.exports = ({ writeFn, dataFn = defaultFn }) => {
  return async (req, res) => {
    if (req.params.id == undefined) throw deps.badRequestError.missingId();

    // Can't set the id, created, or modified.
    delete req.body.id;
    delete req.body.created;
    delete req.body.modified;

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
