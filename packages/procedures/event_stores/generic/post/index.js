const deps = require("./deps");

const { preconditionFailed } = require("@blossm/errors");

module.exports = ({ writeFn, mapReduceFn, publishFn, findOneFn }) => {
  return async (req, res) => {
    const root = req.body.event.headers.root;

    const aggregate = await findOneFn({ root });

    //eslint-disable-next-line
    console.log("payload is: ", req.body.event.payload);
    //eslint-disable-next-line
    console.log("aggregate is: ", aggregate);
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

    const writtenEvent = await writeFn({ id, data: event });
    //eslint-disable-next-line
    console.log("written event: ", writtenEvent);
    await mapReduceFn({ id });
    const aggregate2 = await findOneFn({ root });
    //eslint-disable-next-line
    console.log("aggregate again is: ", aggregate2);
    await publishFn(writtenEvent);

    res.status(204).send();
  };
};
