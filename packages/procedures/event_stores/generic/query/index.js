import deps from "./deps.js";

const doesMatchQuery = ({ state, queryPairs }) => {
  try {
    for (const { key, value: expectedValue } of queryPairs) {
      const propertyParts = key.split(".");
      console.log("propertyParts: ", propertyParts);
      let value = state;
      console.log("value: ", value);
      for (const part of propertyParts) {
        if (value instanceof Array) {
          value = value.find((item) => item[part] == expectedValue);
        } else {
          value = value[part];
        }
        console.log("value: ", value);
        if (!value) return false;
      }
      if (value != expectedValue) return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};

export default ({
  findSnapshotsFn,
  findEventsFn,
  findOneSnapshotFn,
  eventStreamFn,
  handlers,
}) => async (queryPairs) => {
  if (!(queryPairs instanceof Array)) {
    throw deps.badRequestError.message("The query is not an array.", {
      info: { queryPairs },
    });
  }
  for (const queryPair of queryPairs) {
    const { key, value } = queryPair;
    if (!key || !value)
      throw deps.badRequestError.message("A query pair is missing a key or value.", {
        info: { key, value },
      });
  }

  console.log("queryPairs: ", queryPairs);

  const query = Object.fromEntries(
    queryPairs.map(({ key, value }) => [`state.${key}`, value])
  );

  console.log("formatted query: ", query);

  const snapshots = await findSnapshotsFn({
    query: Object.fromEntries(
      queryPairs.map(({ key, value }) => [`state.${key}`, value])
    ),
  });

  console.log("snapshots: ", snapshots);

  const events = await findEventsFn({
    query: Object.fromEntries(
      queryPairs.map(({ key, value }) => [`payload.${key}`, value])
    ),
  });

  console.log("events: ", events);

  if (snapshots.length == 0 && events.length == 0) return [];

  const candidateRoots = [
    ...new Set([
      ...snapshots.map((snapshot) => snapshot.headers.root),
      ...events.map((event) => event.headers.root),
    ]),
  ];

  console.log("candidateRoots: ", candidateRoots);

  const aggregateFn = deps.aggregate({
    findOneSnapshotFn,
    eventStreamFn,
    handlers,
  });

  const aggregates = await Promise.all(
    candidateRoots.map((root) => aggregateFn(root))
  );

  console.log("aggregates: ", aggregates);

  const filteredAggregates = aggregates.filter((aggregate) =>
    doesMatchQuery({ state: aggregate.state, queryPairs })
  );

  console.log("filteredAggregates: ", filteredAggregates);

  return filteredAggregates;
};
