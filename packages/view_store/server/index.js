const logger = require("@sustainers/logger");

const deps = require("./deps");

let _viewStore;

const viewStore = async config => {
  if (_viewStore != undefined) return _viewStore;
  _viewStore = deps.db({
    name: `${process.env.DOMAIN}.${process.env.ID}`,
    ...config,
    connection: {
      urlProtocol: process.env.MONGODB_URL_PROTOCOL,
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

module.exports = async (config, { getFn, postFn, putFn } = {}) => {
  const store = await viewStore(config);
  deps
    .server()
    .get(deps.get({ store, ...(getFn && { fn: getFn }) }))
    .post(deps.post({ store, ...(postFn && { fn: postFn }) }))
    .put(deps.put({ store, ...(putFn && { fn: putFn }) }))
    .delete(deps.delete({ store }))
    .listen();
};
