const deps = require("./deps");

module.exports = app => {
  app.use(
    deps.cors({
      origin: "*",
      methods: "GET,POST",
      preflightContinue: false,
      optionsSuccessStatus: 204
    })
  );
  app.options("*", deps.cors());
};
