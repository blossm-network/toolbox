import deps from "./deps.js";

export default ({ countsStore, snapshotStore }) =>
  async ({
    parallel = 1,
    updatedOnOrAfter,
    updatedBefore,
    limit,
    reverse = false,
    unsnapshottedOnly = false,
    fn,
  }) => {
    if (unsnapshottedOnly) {
      const cursor = countsStore
        .aggregate([
          {
            $match: {
              ...((updatedOnOrAfter != undefined ||
                updatedBefore != undefined) && {
                updated: {
                  ...(updatedOnOrAfter && { $gte: new Date(updatedOnOrAfter) }),
                  ...(updatedBefore && { $lt: new Date(updatedBefore) }),
                },
              }),
            },
          },
          {
            $lookup: {
              from: snapshotStore.collection.name,
              let: { root: "$root" },
              pipeline: [
                { $match: { $expr: { $eq: ["$headers.root", "$$root"] } } },
                { $sort: { "headers.created": -1 } },
                { $limit: 1 },
                { $project: { "headers.lastEventNumber": 1, _id: 0 } },
              ],
              as: "snapshot",
            },
          },
          {
            // Counts are lengths; snapshots record zero-based event numbers.
            $match: {
              $expr: {
                $gt: [
                  "$value",
                  {
                    $add: [
                      {
                        $ifNull: [
                          {
                            $arrayElemAt: [
                              "$snapshot.headers.lastEventNumber",
                              0,
                            ],
                          },
                          -1,
                        ],
                      },
                      1,
                    ],
                  },
                ],
              },
            },
          },
          { $sort: { updated: reverse ? 1 : -1, root: 1 } },
          ...(limit ? [{ $limit: limit }] : []),
          { $project: { root: 1, value: 1, updated: 1, _id: 0 } },
        ])
        .cursor();
      return await cursor.eachAsync(fn, { parallel });
    }
    const cursor = deps.db
      .find({
        store: countsStore,
        query: {
          ...((updatedOnOrAfter != undefined || updatedBefore != undefined) && {
            updated: {
              ...(updatedOnOrAfter && { $gte: updatedOnOrAfter }),
              ...(updatedBefore && { $lt: updatedBefore }),
            },
          }),
        },
        sort: {
          updated: reverse ? 1 : -1,
          root: 1,
        },
        ...(limit && { limit }),
        options: { lean: true },
      })
      .cursor();

    return await cursor.eachAsync(fn, { parallel });
  };
