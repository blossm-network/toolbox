const logger = require("@sustainers/logger");

const deps = require("./deps");

let _viewStore;

const viewStore = async ({ schema, indexes }) => {
  if (_viewStore != undefined) {
    logger.info("Thank you existing database.");
    return _viewStore;
  }

  _viewStore = deps.store({
    name: `${process.env.DOMAIN}.${process.env.NAME}`,
    schema,
    indexes,
    connection: {
      user: process.env.MONGODB_USER,
      password: await deps.secret("mongodb"),
      host: process.env.MONGODB_HOST,
      database: process.env.MONGODB_DATABASE,
      parameters: { authSource: "admin", retryWrites: true, w: "majority" },
      autoIndex: true,
      onOpen: () => logger.info("Thank you database."),
      onError: err => logger.error("Database has errored.", { err })
    }
  });
  return _viewStore;
};

module.exports = async ({ schema, indexes, getFn, postFn, putFn } = {}) => {
  if (schema) {
    schema.id = { type: String, required: true, unique: true };
    schema.created = {
      type: String,
      required: true,
      default: () => deps.stringDate()
    };
    schema.modified = {
      type: String,
      required: true,
      default: () => deps.stringDate()
    };
  }

  if (indexes) {
    indexes.push([{ id: 1 }]);
    indexes.push([{ created: 1 }]);
    indexes.push([{ modified: 1 }]);
  }

  const store = await viewStore({ schema, indexes });

  deps
    .server()
    .get(deps.stream({ store, ...(getFn && { fn: getFn }) }), {
      path: "/stream"
    })
    .get(deps.get({ store, ...(getFn && { fn: getFn }) }))
    .post(deps.post({ store, ...(postFn && { fn: postFn }) }))
    .put(deps.put({ store, ...(putFn && { fn: putFn }) }))
    .delete(deps.delete({ store }))
    .listen();
};
