const logger = require("@blossm/logger");

const deps = require("./deps");

let _viewStore;

const typeKey = "$type";

const viewStore = async ({ schema, indexes, secretFn }) => {
  if (_viewStore != undefined) {
    logger.info("Thank you existing database.");
    return _viewStore;
  }

  const formattedSchema = deps.formatSchema(schema, typeKey);

  _viewStore = deps.db.store({
    name: "views",
    schema: {
      body: formattedSchema,
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
  sorts,
  secretFn,
  queryFn,
  formatCsv,
  sortFn,
  updateFn,
  formatFn,
  emptyFn,
  groupsLookupFn,
  one,
  group,
  updateKeys,
} = {}) => {
  const allIndexes = [
    [{ "headers.id": 1 }],
    ...(process.env.CONTEXT
      ? [
          [
            {
              "headers.context": 1,
            },
          ],
          ...(sorts
            ? sorts.map((sort) => [
                {
                  "headers.context": 1,
                  ...Object.keys(sort).reduce((result, key) => {
                    result[`body.${key}`] = sort[key];
                    return result;
                  }, {}),
                },
              ])
            : []),
        ]
      : []),
    [
      {
        "headers.groups": 1,
      },
    ],
  ];

  const partialWordTextIndexes = [];

  if (indexes) {
    const customIndexes = [];
    for (const index of indexes) {
      let customElement = {};
      let hasTextIndex = false;
      for (const key in index[0]) {
        customElement[`body.${key}`] = index[0][key];
        //Make text indexes partially searchable, with the exception of ids.
        if (index[0][key] == "text") {
          hasTextIndex = true;
          if (!key.endsWith(".id")) partialWordTextIndexes.push(`body.${key}`);
        }
      }

      if (partialWordTextIndexes.length > 0)
        customIndexes.push([
          partialWordTextIndexes.reduce(
            (result, i) => ({ ...result, [i]: 1 }),
            {}
          ),
        ]);

      const customOptions = {};

      //Make the id searchable.
      if (hasTextIndex) {
        customElement["headers.id"] = "text";
        customOptions.name = "text-search";
      }

      if (index[1] && index[1].weights) {
        customOptions.weights = {};
        for (const key in index[1].weights)
          customOptions.weights[`body.${key}`] = index[1].weights[key];
      }

      customIndexes.push([
        customElement,
        ...(Object.keys(customOptions).length > 0 ? [customOptions] : []),
      ]);

      if (sorts && !hasTextIndex) {
        for (const sort of sorts) {
          const sortIndex = {
            ...customElement,
            ...Object.keys(sort).reduce((result, key) => {
              result[`body.${key}`] = sort[key];
              return result;
            }, {}),
          };
          if (Object.keys(sortIndex).length > Object.keys(customElement).length)
            customIndexes.push([sortIndex]);
        }
      }
    }

    allIndexes.push(...customIndexes);
  }

  const store = await viewStore({
    schema,
    indexes: allIndexes,
    secretFn,
  });

  const streamFn = async ({ query, text, sort, select, parallel, fn }) => {
    const textIdUuid = deps.uuidValidator(text);
    const cursor = text
      ? deps.db
          .aggregate({
            store,
            query: {
              ...query,
              $or: [
                {
                  $text: { $search: textIdUuid ? `"${text}"` : text },
                },
                ...(!textIdUuid
                  ? partialWordTextIndexes.map((index) => ({
                      [index]: {
                        $regex: text,
                        $options: "i",
                      },
                    }))
                  : []),
              ],
            },
            ...((select || text) && {
              select: {
                ...select,
                ...(select &&
                  partialWordTextIndexes.reduce((result, index) => {
                    result[index] = 1;
                    return result;
                  }, {})),
                ...(!select && {
                  body: 1,
                  headers: 1,
                  trace: 1,
                }),
                score: { $meta: "textScore" },
              },
            }),
            sort: {
              score: { $meta: "textScore" },
              ...sort,
            },
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

  const findFn = ({ query, text, limit, select, skip, sort }) => {
    const textIdUuid = deps.uuidValidator(text);
    //TODO
    console.log({ text, query: JSON.stringify(query) });
    return text
      ? deps.db.aggregate({
          store,
          query: {
            ...query,
            $or: [
              {
                $text: { $search: textIdUuid ? `"${text}"` : text },
              },
              ...(!textIdUuid
                ? partialWordTextIndexes.map((index) => ({
                    [index]: {
                      $regex: text,
                      $options: "i",
                    },
                  }))
                : []),
            ],
          },
          select: {
            ...select,
            ...(select &&
              partialWordTextIndexes.reduce((result, index) => {
                result[index] = 1;
                return result;
              }, {})),
            ...(!select && {
              body: 1,
              headers: 1,
              trace: 1,
            }),
            score: { $meta: "textScore" },
          },
          sort: {
            score: { $meta: "textScore" },
            ...sort,
          },
          ...(limit && { limit }),
          ...(skip && { skip }),
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
  };

  const countFn = async ({ query, text }) => {
    const textIdUuid = deps.uuidValidator(text);
    return await deps.db.count({
      store,
      query: {
        ...query,
        ...(text && {
          $or: [
            {
              $text: { $search: textIdUuid ? `"${text}"` : text },
            },
            ...(!textIdUuid
              ? partialWordTextIndexes.map((index) => ({
                  [index]: {
                    $regex: text,
                    $options: "i",
                  },
                }))
              : []),
          ],
        }),
      },
    });
  };

  const writeFn = async ({ query, data, arrayFilters }) => {
    const update = {};
    const setKey = "$set";
    let containsMatcher = false;
    for (const key of Object.keys(data)) {
      if (key.charAt(0) == "$") {
        update[key] = {
          ...update[key],
          ...data[key],
        };
      } else {
        if (key.includes(".$")) containsMatcher = true;
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
        upsert: !containsMatcher,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        ...(arrayFilters && { arrayFilters }),
      },
    });
  };

  const removeFn = (query) =>
    deps.db.remove({
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
    ...(formatCsv && { formatCsv }),
    ...(sortFn && { sortFn }),
    ...(updateFn && { updateFn }),
    ...(formatFn && { formatFn }),
    ...(emptyFn && { emptyFn }),
    ...(one && { one }),
    ...(group && { group }),
    ...(updateKeys && { updateKeys }),
  });
};
