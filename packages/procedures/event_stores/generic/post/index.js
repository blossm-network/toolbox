const deps = require("./deps");

const { preconditionFailed } = require("@blossm/errors");

module.exports = ({ saveEventFn, aggregateFn, publishFn }) => {
  return async (req, res) => {
    const root = req.body.event.headers.root;

    const aggregate = await aggregateFn(root);

    //eslint-disable-next-line
    console.log(
      "lastEventNumber is: ",
      aggregate ? aggregate.headers.lastEventNumber : null
    );
    const number = aggregate ? aggregate.headers.lastEventNumber + 1 : 0;
    //eslint-disable-next-line
    console.log("new number is: ", number);

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

    const savedEvent = await saveEventFn(event);

    await publishFn(savedEvent);

    res.status(204).send();
  };
};
