const deps = require("./deps");

module.exports = (app) => {
  app.use(deps.jsonBodyParser());
  app.use(deps.cookieParser());
};
