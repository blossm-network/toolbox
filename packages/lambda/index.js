require("localenv");

const logger = require("@sustainers/logger");

const deps = require("./deps");

module.exports = ({ port = 3000 } = {}) => {
  const app = deps.express();
  deps.expressMiddleware(app);
  port = process.env.PORT || port;
  app.listen(port);
  logger.info("Listening...", { port });

  return {
    post: (fn, { path = "/" } = {}) => {
      app.post(path, deps.asyncHandler(fn));
      app.use(deps.errorMiddleware);
      return app;
    },
    get: (fn, { path = "/" } = {}) => {
      app.get(path, deps.asyncHandler(fn));
      app.use(deps.errorMiddleware);
      return app;
    }
  };
};
