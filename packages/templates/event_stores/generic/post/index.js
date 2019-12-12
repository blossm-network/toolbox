const deps = require("./deps");

module.exports = ({ writeFn, mapReduceFn, publishFn }) => {
  return async (req, res) => {
    const id = deps.uuid();

    const now = deps.dateString();

    const data = {
      ...req.body,
      id,
      created: now
    };

    await writeFn({ id, data });
    await mapReduceFn({ id });
    await publishFn(data);

    res.status(204).send();
  };
};
