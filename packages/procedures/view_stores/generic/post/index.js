const deps = require("./deps");

const defaultFn = body => {
  return { data: body };
};

module.exports = ({ writeFn, fn = defaultFn }) => {
  return async (req, res) => {
    const id = deps.uuid();

    const now = deps.dateString();

    const { data: _data } = fn(req.body);

    const data = {
      ..._data,
      id,
      modified: now,
      created: now
    };

    await writeFn({
      id,
      data
    });

    res.status(204).send();
  };
};
