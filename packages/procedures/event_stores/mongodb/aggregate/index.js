const deps = require("./deps");

const { badRequest } = require("@blossm/errors");

module.exports = ({ eventStore, snapshotStore, handlers }) => async root => {
  const [events, snapshot] = await Promise.all([
    deps.db.find({
      store: eventStore,
      query: {
        "headers.root": root
      },
      sort: {
        "headers.number": 1
      },
      options: {
        lean: true
      }
    }),
    deps.db.findOne({
      store: snapshotStore,
      query: {
        "headers.root": root
      },
      options: {
        lean: true
      }
    })
  ]);

  if (!events.length && !snapshot) return null;

  const aggregate = events
    .filter(event =>
      snapshot ? event.headers.number > snapshot.headers.lastEventNumber : true
    )
    .reduce(
      (accumulator, event) => {
        const handler = handlers[event.headers.action];

        //TODO
        //eslint-disable-next-line no-console
        console.log({
          root,
          accumulator,
          event,
          hasHandler: handler != undefined,
          handlerResponse: handler(accumulator.state, event.payload)
        });
        if (!handler)
          throw badRequest.eventHandlerNotSpecified({
            info: {
              action: event.headers.action
            }
          });

        return {
          headers: {
            root: accumulator.headers.root,
            lastEventNumber: event.headers.number
          },
          state: handler(accumulator.state, event.payload)
        };
      },
      {
        headers: snapshot ? snapshot.headers : { root },
        state: snapshot ? snapshot.state : {}
      }
    );

  return aggregate;
};
