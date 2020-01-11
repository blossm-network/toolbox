const deps = require("./deps");

const { preconditionFailed } = require("@blossm/errors");

module.exports = ({ createEventFn, createAggregateFn, publishFn }) => {
  return async (req, res) => {
    const root = req.body.event.headers.root;

    const aggregate = await createAggregateFn(root);

    const number = aggregate ? aggregate.headers.number + 1 : 0;

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

    const savedEvent = await createEventFn(event);

    await publishFn(savedEvent);

    res.status(204).send();
  };
};
