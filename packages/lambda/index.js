require("localenv");

const logger = require("@sustainers/logger");

const deps = require("./deps");

module.exports = ({ port = 3000 } = {}) => {
  const app = deps.express();
  deps.expressMiddleware(app);

  port = process.env.PORT || port;

  const listen = () => {
    app.use(deps.errorMiddleware);
    app.listen(port);
    logger.info("Listening...", { port });
    return app;
  };

  return {
    post: (fn, { path = "/" } = {}) => {
      app.post(path, deps.asyncHandler(fn));
      return listen();
    },
    get: (fn, { path = "/" } = {}) => {
      app.get(path, deps.asyncHandler(fn));
      return listen();
    }
  };
};
