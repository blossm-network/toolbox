const logger = require("@blossm/logger");

const deps = require("./deps");

let _viewStore;

const typeKey = "$type";

const viewStore = async ({ schema, indexes, secretFn }) => {
  if (_viewStore != undefined) {
    logger.info("Thank you existing database.");
    return _viewStore;
  }

  const formattedSchema = deps.formatSchema(
    { body: { type: schema, default: {} } },
    typeKey
  );

  _viewStore = deps.db.store({
    name: "views",
    schema: {
      ...formattedSchema,
      headers: {
        id: {
          [typeKey]: String,
          required: true,
          unique: true,
          default: deps.uuid,
        },
        context: {
          [typeKey]: {
            root: String,
            domain: String,
            service: String,
            network: String,
            _id: false,
          },
          required: true,
        },
        groups: {
          [typeKey]: [
            {
              root: String,
              service: String,
              network: String,
              _id: false,
            },
          ],
          default: undefined,
        },
        created: {
          [typeKey]: Date,
          required: true,
          default: deps.dateString,
        },
        modified: {
          [typeKey]: Date,
          required: true,
          default: deps.dateString,
        },
        _id: false,
      },
      trace: { [typeKey]: Object },
    },
    indexes,
    typeKey,
    connection: {
      protocol: process.env.MONGODB_PROTOCOL,
      user: process.env.MONGODB_USER,
      password:
        process.env.NODE_ENV == "local"
          ? process.env.MONGODB_USER_PASSWORD
          : await secretFn("mongodb-view-store"),
      host: process.env.MONGODB_HOST,
      database: process.env.MONGODB_DATABASE,
      parameters: { authSource: "admin", retryWrites: true, w: "majority" },
      autoIndex: true,
    },
  });
  return _viewStore;
};

module.exports = async ({
  schema,
  indexes,
  secretFn,
  queryFn,
  sortFn,
  updateFn,
  formatFn,
  emptyFn,
  groupsLookupFn,
  one,
  group,
} = {}) => {
  const allIndexes = [
    [{ "headers.id": 1 }],
    [
      { ["headers.context.root"]: 1 },
      { ["headers.context.domain"]: 1 },
      { ["headers.context.service"]: 1 },
      { ["headers.context.network"]: 1 },
    ],
    [
      { ["headers.groups.root"]: 1 },
      { ["headers.groups.service"]: 1 },
      { ["headers.groups.network"]: 1 },
    ],
  ];

  const textIndexes = [];
  if (indexes) {
    const customIndexes = [];
    for (const index of indexes) {
      let customElement = {};
      for (const element of index) {
        for (const key in element) {
          customElement[`body.${key}`] = element[key];
          if (element[key] == "text" && key != "$**")
            textIndexes.push(`body.${key}`);
        }
      }
      customIndexes.push([customElement]);
    }
    allIndexes.push(...customIndexes);
  }

  const store = await viewStore({
    schema,
    indexes: allIndexes,
    secretFn,
  });

  const streamFn = async ({ query, text, sort, select, parallel, fn }) => {
    const cursor = text
      ? deps.db
          .aggregate({
            store,
            query: {
              ...query,
              $or: [
                {
                  ...(text && { $text: { $search: text } }),
                },
                ...textIndexes.map((index) => ({
                  [index]: {
                    $regex: text,
                  },
                })),
              ],
            },
            ...((select || text) && {
              select: {
                ...select,
                ...(select &&
                  textIndexes.reduce((result, index) => {
                    result[index] = 1;
                    return result;
                  }, {})),
                ...(!select && {
                  body: 1,
                  headers: 1,
                  trace: 1,
                }),
                score: {
                  $add: [
                    { $meta: "textScore" },
                    ...textIndexes.map((index) => ({
                      $cond: [{ $eq: [`$${index}`, text] }, 10, 0],
                    })),
                  ],
                },
              },
            }),
            ...((sort || text) && {
              sort: {
                ...sort,
                score: -1,
              },
            }),
          })
          .cursor()
      : deps.db
          .find({
            store,
            query,
            ...(sort && { sort }),
            ...(select && { select }),
            options: {
              lean: true,
            },
          })
          .cursor();

    return await cursor.eachAsync(fn, { parallel });
  };

  const findFn = ({ query, text, limit, select, skip, sort }) =>
    text
      ? deps.db.aggregate({
          store,
          query: {
            ...query,
            $or: [
              {
                ...(text && { $text: { $search: text } }),
              },
              ...textIndexes.map((index) => ({
                [index]: {
                  $regex: text,
                },
              })),
            ],
          },
          ...((select || text) && {
            select: {
              ...select,
              ...(select &&
                textIndexes.reduce((result, index) => {
                  result[index] = 1;
                  return result;
                }, {})),
              ...(!select && {
                body: 1,
                headers: 1,
                trace: 1,
              }),
              score: {
                $add: [
                  { $meta: "textScore" },
                  ...textIndexes.map((index) => ({
                    $cond: [{ $eq: [`$${index}`, text] }, 10, 0],
                  })),
                ],
              },
            },
          }),
          ...((sort || text) && {
            sort: {
              ...sort,
              score: -1,
            },
          }),
        })
      : deps.db.find({
          store,
          query,
          ...(select && { select }),
          ...(limit && { limit }),
          ...(skip && { skip }),
          ...(sort && { sort }),
          options: {
            lean: true,
          },
        });

  const countFn = async ({ query, text }) =>
    await deps.db.count({
      store,
      query: {
        ...query,
        ...(text && { $text: { $search: text } }),
      },
    });

  const writeFn = async ({ query, data }) => {
    const update = {};
    const setKey = "$set";
    for (const key of Object.keys(data)) {
      if (key.charAt(0) == "$") {
        update[key] = {
          ...update[key],
          ...data[key],
        };
      } else {
        update[setKey] = {
          ...update[setKey],
          [key]: data[key],
        };
      }
    }

    return await deps.db.write({
      store,
      query,
      update,
      options: {
        lean: true,
        omitUndefined: true,
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    });
  };

  const removeFn = async (query) =>
    await deps.db.remove({
      store,
      query,
    });

  deps.viewStore({
    streamFn,
    findFn,
    writeFn,
    removeFn,
    countFn,
    groupsLookupFn,
    ...(queryFn && { queryFn }),
    ...(sortFn && { sortFn }),
    ...(updateFn && { updateFn }),
    ...(formatFn && { formatFn }),
    ...(emptyFn && { emptyFn }),
    ...(one && { one }),
    ...(group && { group }),
  });
};
