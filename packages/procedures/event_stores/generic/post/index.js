const deps = require("./deps");

const { preconditionFailed } = require("@blossm/errors");

module.exports = ({ writeFn, mapReduceFn, publishFn, findOneFn }) => {
  return async (req, res) => {
    //eslint-disable-next-line
    console.log("in event store: ", req.body);

    const root = req.body.event.headers.root;

    const aggregate = await findOneFn({ root });

    const number = aggregate ? aggregate.headers.lastEventNumber + 1 : 0;

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

    //eslint-disable-next-line
    console.log("event : ", event);

    const writtenEvent = await writeFn({ id, data: event });

    //eslint-disable-next-line
    console.log("writtenEvent : ", writtenEvent);

    await mapReduceFn({ id });
    await publishFn(writtenEvent);

    res.status(204).send();
  };
};
