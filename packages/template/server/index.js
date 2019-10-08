require("localenv");

const logger = require("@sustainers/logger");

const deps = require("./deps");

module.exports = ({ prehook, posthook } = {}) => {
  const app = deps.express();
  if (prehook) prehook(app);
  deps.expressMiddleware(app);

  const listen = ({ port } = {}) => {
    port = port || process.env.PORT || 3000;
    if (posthook) posthook(app);
    app.use(deps.errorMiddleware);
    app.listen(port);
    logger.info("Thank you server.", { port });
    return app;
  };

  const methods = {
    post: (
      fn,
      { path = "/", preMiddleware = [], postMiddleware = [] } = {}
    ) => {
      preMiddleware.forEach(m => app.use(m));
      app.post(path, deps.asyncHandler(fn));
      postMiddleware.forEach(m => app.use(m));
      return { ...methods, listen };
    },
    put: (
      fn,
      { path = "/:id", preMiddleware = [], postMiddleware = [] } = {}
    ) => {
      preMiddleware.forEach(m => app.use(m));
      app.put(path, deps.asyncHandler(fn));
      postMiddleware.forEach(m => app.use(m));
      return { ...methods, listen };
    },
    get: (
      fn,
      { path = "/:id?", preMiddleware = [], postMiddleware = [] } = {}
    ) => {
      preMiddleware.forEach(m => app.use(m));
      app.get(path, deps.asyncHandler(fn));
      postMiddleware.forEach(m => app.use(m));
      return { ...methods, listen };
    },
    delete: (
      fn,
      { path = "/:id", preMiddleware = [], postMiddleware = [] } = {}
    ) => {
      preMiddleware.forEach(m => app.use(m));
      app.delete(path, deps.asyncHandler(fn));
      postMiddleware.forEach(m => app.use(m));
      return { ...methods, listen };
    }
  };

  return methods;
};
