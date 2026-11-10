import deps from "./deps.js";

const matches = (value, parts, expected) => {
  if (parts.length === 0) return value === expected;
  if (Array.isArray(value))
    return value.some((item) => matches(item, parts, expected));
  if (value === null || typeof value !== "object") return false;
  const [key, ...rest] = parts;
  if (!Object.hasOwn(value, key)) return false;
  return matches(value[key], rest, expected);
};

export default ({
    rootStreamFn,
    findSnapshotsFn,
    findOneSnapshotFn,
    eventStreamFn,
    handlers,
  }) =>
  async (queryPairs) => {
    if (!Array.isArray(queryPairs))
      throw deps.badRequestError.message("The query is not an array.", {
        info: { queryPairs },
      });
    for (const pair of queryPairs) {
      const { key, value } = pair || {};
      if (
        typeof key !== "string" ||
        key.length === 0 ||
        (value !== null &&
          !["string", "number", "boolean"].includes(typeof value))
      )
        throw deps.badRequestError.message(
          "A query pair is missing a key or value.",
          { info: { key, value } },
        );
    }

    const aggregateFn = deps.aggregate({
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
    });
    const roots = new Set();
    if (queryPairs.length) {
      const snapshots = await findSnapshotsFn({
        query: {
          $and: queryPairs.map(({ key, value }) => ({
            [`state.${key}`]: value,
          })),
        },
        select: { "headers.root": 1 },
        limit: null,
      });
      for (const snapshot of snapshots) roots.add(snapshot.headers.root);
    }
    await rootStreamFn({
      parallel: 1,
      ...(queryPairs.length && { unsnapshottedOnly: true }),
      fn: async ({ root }) => {
        roots.add(root);
      },
    });
    const results = [];
    for (const root of roots) {
      const aggregate = await aggregateFn(root);
      if (
        aggregate &&
        queryPairs.every(({ key, value }) =>
          matches(aggregate.state, key.split("."), value),
        )
      )
        results.push(aggregate);
    }
    return results;
  };
