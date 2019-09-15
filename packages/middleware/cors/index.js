const deps = require("./deps");

module.exports = app => {
  app.use(
    deps.cors({
      origin: "*",
      methods: "GET,POST",
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true
    })
  );
  app.options("*", deps.cors());
};
