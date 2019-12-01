const deps = require("./deps");

module.exports = ({ writeFn, mapReduceFn }) => {
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

    res.status(204).send();
  };
};
