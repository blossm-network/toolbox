require("localenv");

const logger = require("@blossm/logger");

const deps = require("./deps");

module.exports = ({ prehook, posthook } = {}) => {
  const app = deps.express();
  if (prehook) prehook(app);
  deps.expressMiddleware(app);

  const listen = ({ port } = {}) => {
    port = port || process.env.PORT || 3000;
    app.get("/_sup", (_, res, next) => {
      res.send("nmjc");
      next();
    });
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
      app.post(
        path,
        ...preMiddleware,
        deps.asyncHandler(fn),
        ...postMiddleware
      );
      return { ...methods, listen };
    },
    put: (
      fn,
      { path = "/:id", preMiddleware = [], postMiddleware = [] } = {}
    ) => {
      app.put(path, ...preMiddleware, deps.asyncHandler(fn), ...postMiddleware);
      return { ...methods, listen };
    },
    get: (
      fn,
      { path = "/:id?", preMiddleware = [], postMiddleware = [] } = {}
    ) => {
      app.get(path, ...preMiddleware, deps.asyncHandler(fn), ...postMiddleware);
      return { ...methods, listen };
    },
    delete: (
      fn,
      { path = "/:id?", preMiddleware = [], postMiddleware = [] } = {}
    ) => {
      app.delete(
        path,
        ...preMiddleware,
        deps.asyncHandler(fn),
        ...postMiddleware
      );
      return { ...methods, listen };
    },
  };

  return methods;
};
