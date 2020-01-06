const deps = require("./deps");

module.exports = ({ writeFn, mapReduceFn, publishFn }) => {
  return async (req, res) => {
    const id = deps.uuid();

    const now = deps.dateString();

    const event = {
      ...req.body,
      id,
      created: now
    };

    const writtenEvent = await writeFn({ id, data: event });
    await mapReduceFn({ id });
    await publishFn(writtenEvent);

    res.status(204).send();
  };
};
