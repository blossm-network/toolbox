const deps = require("./deps");

const { preconditionFailed, badRequest } = require("@blossm/errors");

module.exports = ({ saveEventsFn, aggregateFn, publishFn }) => {
  return async (req, res) => {
    //TODO
    //eslint-disable-next-line no-console
    console.log({
      body: req.body,
      query: req.query,
      params: req.params,
      events: req.body.events
    });
    const eventNumberOffsets = {};
    const eventRoots = [
      ...new Set(req.body.events.map(event => event.data.headers.root))
    ];

    const [...aggregates] = await Promise.all(
      eventRoots.map(root => aggregateFn(root))
    );

    const lastEventNumbers = aggregates.reduce((result, aggregate) => {
      if (!aggregate) return result;
      result[aggregate.headers.root] = aggregate.headers.lastEventNumber;
      return result;
    }, {});

    const normalizedEvents = req.body.events.map(event => {
      if (!eventNumberOffsets[event.data.headers.root])
        eventNumberOffsets[event.data.headers.root] = 0;

      const topicParts = event.data.headers.topic.split(".");
      const topicDomain = topicParts[1];
      const topicService = topicParts[2];

      if (
        topicDomain != process.env.DOMAIN ||
        topicService != process.env.SERVICE
      )
        throw badRequest.wrongEventStore({
          info: {
            expected: `${process.env.DOMAIN}.${process.env.SERVICE}`,
            actual: `${topicDomain}.${topicService}`
          }
        });

      const root = event.data.headers.root;

      const number =
        (lastEventNumbers[event.data.headers.root] != undefined
          ? lastEventNumbers[event.data.headers.root] + 1
          : 0) + eventNumberOffsets[event.data.headers.root];

      if (event.number && event.number != number)
        throw preconditionFailed.eventNumberIncorrect({
          info: { expected: req.body.number, actual: number }
        });

      const now = deps.dateString();

      const normalizedEvent = {
        ...event.data,
        headers: {
          ...event.data.headers,
          number,
          idempotency: event.data.headers.idempotency || deps.uuid()
        },
        id: `${root}_${number}`,
        saved: now
      };

      eventNumberOffsets[event.data.headers.root]++;
      return normalizedEvent;
    });

    const savedEvents = await saveEventsFn(normalizedEvents);
    await publishFn(savedEvents);

    res.status(204).send();
  };
};
