const deps = require("./deps");

module.exports = ({ saveEventsFn, reserveRootCountsFn, publishFn }) => {
  return async (req, res) => {
    const eventNumberOffsets = {};

    const eventRootCounts = req.body.events.reduce((result, event) => {
      if (result[event.data.headers.root] == undefined)
        result[event.data.headers.root] = 0;
      result[event.data.headers.root]++;
      return result;
    }, {});

    const [...updatedCountObjects] = await Promise.all(
      Object.keys(eventRootCounts).map((root) =>
        reserveRootCountsFn({ root, amount: eventRootCounts[root] })
      )
    );

    const currentEventCounts = updatedCountObjects.reduce(
      (result, countObject) => {
        result[countObject.root] =
          countObject.value - eventRootCounts[countObject.root];
        return result;
      },
      {}
    );

    const normalizedEvents = req.body.events.map((event) => {
      if (!eventNumberOffsets[event.data.headers.root])
        eventNumberOffsets[event.data.headers.root] = 0;

      const topicParts = event.data.headers.topic.split(".");
      const topicDomain = topicParts[1];
      const topicService = topicParts[2];

      if (
        topicDomain != process.env.DOMAIN ||
        topicService != process.env.SERVICE
      )
        throw deps.badRequestError.message(
          "This event store can't accept this event.",
          {
            info: {
              expected: `${process.env.DOMAIN}.${process.env.SERVICE}`,
              actual: `${topicDomain}.${topicService}`,
            },
          }
        );

      const root = event.data.headers.root;

      const number =
        currentEventCounts[event.data.headers.root] +
        eventNumberOffsets[event.data.headers.root];

      if (event.number && event.number != number)
        throw deps.preconditionFailedError.message("Event number incorrect.", {
          info: { expected: req.body.number, actual: number },
        });

      const now = deps.dateString();

      const normalizedEvent = {
        ...event.data,
        headers: {
          ...event.data.headers,
          number,
          idempotency: event.data.headers.idempotency || deps.uuid(),
        },
        id: `${root}_${number}`,
        saved: now,
      };

      eventNumberOffsets[event.data.headers.root]++;
      return normalizedEvent;
    });

    const savedEvents = await saveEventsFn(normalizedEvents);
    await Promise.all(
      savedEvents.map((e) =>
        publishFn(
          {
            root: e.headers.root,
          },
          e.headers.topic
        )
      )
    );

    res.sendStatus(204);
  };
};
