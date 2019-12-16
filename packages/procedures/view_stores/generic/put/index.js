const deps = require("./deps");

const defaultFn = body => {
  return { data: body };
};

module.exports = ({ writeFn, fn = defaultFn }) => {
  return async (req, res) => {
    //eslint-disable-next-line
    console.log("1: ", req.params.id);
    if (req.params.id == undefined) throw deps.badRequestError.missingId();

    // Can't set the id, created, or modified.
    delete req.body.id;
    delete req.body.created;
    delete req.body.modified;

    const { data: customData } = fn(req.body);

    const data = {
      ...customData,
      modified: deps.dateString()
    };

    //eslint-disable-next-line
    console.log("2: ", data);
    await writeFn({
      id: req.params.id,
      data
    });

    //eslint-disable-next-line
    console.log("3");
    res.status(204).send();
  };
};
