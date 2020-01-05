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

    //eslint-disable-next-line
    console.log("prewrite event: ", event);
    const writtenEvent = await writeFn({ id, data: event });
    //eslint-disable-next-line
    console.log("written event: ", writtenEvent);
    await mapReduceFn({ id });
    await publishFn(writtenEvent);

    res.status(204).send();
  };
};
