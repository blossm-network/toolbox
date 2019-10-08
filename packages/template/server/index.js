require("localenv");

const logger = require("@sustainers/logger");

const deps = require("./deps");

module.exports = ({ premiddleware = [], postmiddleware = [] } = {}) => {
  const app = deps.express();
  premiddleware.forEach(middleware => app.use(middleware));
  deps.expressMiddleware(app);

  const listen = ({ port } = {}) => {
    port = port || process.env.PORT || 3000;
    postmiddleware.forEach(middleware => app.use(middleware));
    app.use(deps.errorMiddleware);
    app.listen(port);
    logger.info("Thank you server.", { port });
    return app;
  };

  const methods = {
    post: (fn, { path = "/" } = {}) => {
      app.post(path, deps.asyncHandler(fn));
      return { ...methods, listen };
    },
    put: (fn, { path = "/:id" } = {}) => {
      app.put(path, deps.asyncHandler(fn));
      return { ...methods, listen };
    },
    get: (fn, { path = "/:id?" } = {}) => {
      app.get(path, deps.asyncHandler(fn));
      return { ...methods, listen };
    },
    delete: (fn, { path = "/:id" } = {}) => {
      app.delete(path, deps.asyncHandler(fn));
      return { ...methods, listen };
    }
  };

  return methods;
};
