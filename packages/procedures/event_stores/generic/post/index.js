const deps = require("./deps");

const { preconditionFailed } = require("@blossm/errors");

module.exports = ({ saveEventFn, aggregateFn, publishFn }) => {
  return async (req, res) => {
    const root = req.body.event.headers.root;

    //eslint-disable-next-line
    console.log("event: ", req.body.event);

    const aggregate = await aggregateFn(root);

    //eslint-disable-next-line
    console.log("aggregate: ", aggregate);

    const number = aggregate ? aggregate.headers.lastEventNumber + 1 : 0;

    //eslint-disable-next-line
    console.log("number: ", number);

    if (req.body.number && req.body.number != number)
      throw preconditionFailed.eventNumberIncorrect({
        info: { expected: req.body.number, actual: number }
      });

    const now = deps.dateString();

    const event = {
      ...req.body.event,
      headers: {
        ...req.body.event.headers,
        number
      },
      id: `${root}_${number}`,
      saved: now
    };

    //eslint-disable-next-line
    console.log("event to save: ", event);

    const savedEvent = await saveEventFn(event);

    //eslint-disable-next-line
    console.log("saved event: ", event);

    await publishFn(savedEvent);

    res.status(204).send();
  };
};
