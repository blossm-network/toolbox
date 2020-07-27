const deps = require("./deps");

//TODO move this fn into generic.
const doesMatchQuery = ({ state, query }) => {
  try {
    for (const property in query) {
      const propertyParts = property.split(".");
      let value = {
        ...state,
      };
      for (const part of propertyParts) value = value[part];
      if (value != query[property]) return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};

module.exports = ({
  findSnapshotsFn,
  findEventsFn,
  findOneSnapshotFn,
  eventStreamFn,
  handlers,
}) => async ({ key, value }) => {
  if (!key || !value)
    throw deps.badRequestError.message("The query is missing a key or value.", {
      info: { key, value },
    });

  const snapshots = await findSnapshotsFn({
    query: { [`state.${key}`]: value },
  });
  const events = await findEventsFn({
    query: {
      [`payload.${key}`]: value,
    },
    ...(snapshots.length && {
      sort: {
        ["headers.created"]: {
          $gt: snapshots.sort((a, b) =>
            a.headers.created < b.headers.created
              ? -1
              : a.headers.created > b.headers.created
              ? 1
              : 0
          )[0].headers.created,
        },
      },
    }),
  });

  if (snapshots.length == 0 && events.length == 0) return [];

  const candidateRoots = [
    ...new Set([
      ...snapshots.map((snapshot) => snapshot.headers.root),
      ...events.map((event) => event.headers.root),
    ]),
  ];

  const aggregateFn = deps.aggregate({
    findOneSnapshotFn,
    eventStreamFn,
    handlers,
  });
  const aggregates = await Promise.all(
    candidateRoots.map((root) => aggregateFn(root))
  );

  const filteredAggregates = aggregates.filter((aggregate) =>
    doesMatchQuery({ state: aggregate.state, query: { [key]: value } })
  );

  return filteredAggregates;
};
