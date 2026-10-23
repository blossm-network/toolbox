import deps from "./deps.js";

const matches = (value, parts, expected) => {
  if (parts.length === 0)
    return expected === null ? value === null : value == expected;
  if (Array.isArray(value))
    return value.some((item) => matches(item, parts, expected));
  if (value == undefined) return false;
  const [key, ...rest] = parts;
  return matches(value[key], rest, expected);
};

export default ({ rootStreamFn, findOneSnapshotFn, eventStreamFn, handlers }) =>
  async (queryPairs) => {
    if (!Array.isArray(queryPairs))
      throw deps.badRequestError.message("The query is not an array.", {
        info: { queryPairs },
      });
    for (const { key, value } of queryPairs) {
      if (!key || value === undefined)
        throw deps.badRequestError.message(
          "A query pair is missing a key or value.",
          { info: { key, value } }
        );
    }

    const aggregateFn = deps.aggregate({
      findOneSnapshotFn,
      eventStreamFn,
      handlers,
    });
    const results = [];
    await rootStreamFn({
      parallel: 1,
      fn: async ({ root }) => {
        const aggregate = await aggregateFn(root);
        if (
          aggregate &&
          queryPairs.every(({ key, value }) =>
            matches(aggregate.state, key.split("."), value)
          )
        )
          results.push(aggregate);
      },
    });
    return results;
  };
