const deps = require("./deps");

const { badRequest } = require("@blossm/errors");

const doesMatchQuery = ({ state, query }) => {
  try {
    for (const property in query) {
      const propertyParts = property.split(".");
      let value = {
        ...state
      };
      for (const part of propertyParts) value = value[part];
      if (value != query[property]) return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};

module.exports = ({ eventStore, snapshotStore, handlers }) => async ({
  key,
  value
}) => {
  if (!key || !value)
    throw badRequest.incompleteQuery({ info: { key, value } });

  const [snapshots, events] = await Promise.all([
    deps.db.find({
      store: snapshotStore,
      query: {
        [`state.${key}`]: value
      },
      options: {
        lean: true
      }
    }),
    deps.db.find({
      store: eventStore,
      query: {
        [`payload.${key}`]: value
      },
      options: {
        lean: true
      }
    })
  ]);

  if (snapshots.length == 0 && events.length == 0) return [];

  const aggregateFn = deps.aggregate({ eventStore, snapshotStore, handlers });

  if (events.length == 0) {
    const aggregates = await Promise.all(
      snapshots.map(snapshot => aggregateFn(snapshot.headers.root))
    );

    return aggregates;
  }

  const candidateRoots = [
    ...new Set([
      ...snapshots.map(snapshot => snapshot.headers.root),
      ...events.map(event => event.headers.root)
    ])
  ];

  const aggregates = await Promise.all(
    candidateRoots.map(root => aggregateFn(root))
  );

  const filteredAggregates = aggregates.filter(aggregate =>
    doesMatchQuery({ state: aggregate.state, query: { [key]: value } })
  );

  return filteredAggregates;
};
