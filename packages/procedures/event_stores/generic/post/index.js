const deps = require("./deps");

const { preconditionFailed } = require("@blossm/errors");

module.exports = ({ writeFn, mapReduceFn, publishFn, findOneFn }) => {
  return async (req, res) => {
    const root = req.body.event.headers.root;

    const {
      headers: { lastEventNumber }
    } = await findOneFn({ root });

    const number = lastEventNumber + 1;

    if (req.body.number && req.body.number != number)
      throw preconditionFailed.eventNumberIncorrect({
        info: { expected: req.body.number, actual: number }
      });

    const id = deps.uuid();

    const now = deps.dateString();

    const event = {
      ...req.body.event,
      headers: {
        ...req.body.event.headers,
        number,
        numberRoot: `${number}_${root}`
      },
      id,
      created: now
    };

    const writtenEvent = await writeFn({ id, data: event });
    await mapReduceFn({ id });
    await publishFn(writtenEvent);

    res.status(204).send();
  };
};
