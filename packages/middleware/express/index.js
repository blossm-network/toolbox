import deps from "./deps.js";

export default (app) => {
  app.use(deps.jsonBodyParser());
  app.use(deps.cookieParser());
};
