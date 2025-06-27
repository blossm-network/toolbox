import "localenv";
import logger from "@blossm/logger";

import deps from "./deps.js";

export default ({ prehook, posthook } = {}) => {
  const app = deps.express();
  if (prehook) prehook(app);
  deps.expressMiddleware(app);

  app.get("/_check-in", (_, res) => {
    res.send("ok");
  });

  const listen = ({ port } = {}) => {
    console.log("port", { port, process: process.env.PORT });
    port = port || process.env.PORT || 3000;
    console.log({ resultingPort: port });
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
